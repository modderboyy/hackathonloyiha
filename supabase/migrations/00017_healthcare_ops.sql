-- =====================================================================
-- CareLink — Migration 00017: healthcare ops model
-- doctors, schedules, appointments, rooms, emergency SOS alerts
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.facilities(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  specialty text not null,
  degree text,
  phone text,
  email text,
  is_active boolean not null default true,
  experience_years integer not null default 0,
  rating numeric(2,1) not null default 5.0,
  created_at timestamptz not null default now()
);

create index if not exists idx_doctors_clinic on public.doctors(clinic_id);
create index if not exists idx_doctors_active on public.doctors(is_active);

create table if not exists public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  room_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (doctor_id, weekday, start_time, end_time)
);

create index if not exists idx_doctor_schedules_doctor on public.doctor_schedules(doctor_id);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.facilities(id) on delete cascade,
  name text not null,
  floor integer not null default 1,
  capacity integer not null default 1,
  status text not null default 'available' check (status in ('available','occupied','cleaning','maintenance')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_clinic on public.rooms(clinic_id);
create index if not exists idx_rooms_status on public.rooms(status);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  room_id uuid references public.rooms(id) on delete set null,
  appointment_date date not null,
  slot_start time not null,
  slot_end time not null,
  queue_code text not null,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled','waiting')),
  notes text,
  created_at timestamptz not null default now(),
  unique (doctor_id, appointment_date, slot_start, slot_end)
);

create index if not exists idx_appointments_clinic on public.appointments(clinic_id);
create index if not exists idx_appointments_doctor on public.appointments(doctor_id);
create index if not exists idx_appointments_patient on public.appointments(patient_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);

create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  clinic_id uuid references public.facilities(id) on delete set null,
  priority text not null default 'high' check (priority in ('critical','high','moderate')),
  status text not null default 'open' check (status in ('open','accepted','resolved')),
  location_lat numeric(9,6),
  location_lng numeric(9,6),
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sos_alerts_clinic on public.sos_alerts(clinic_id);
create index if not exists idx_sos_alerts_status on public.sos_alerts(status);

-- RLS policies
alter table public.doctors enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.rooms enable row level security;
alter table public.appointments enable row level security;
alter table public.sos_alerts enable row level security;

create policy if not exists "doctors_read_all" on public.doctors
  for select using (
    public.is_super_admin()
    or public.is_medical_worker()
    or exists (
      select 1 from public.patients p
      where p.id = auth.uid()::uuid
    )
  );

create policy if not exists "doctors_manage_clinic" on public.doctors
  for all using (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    )
  ) with check (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    )
  );

create policy if not exists "schedules_read_all" on public.doctor_schedules
  for select using (
    public.is_super_admin() or public.is_medical_worker() or auth.uid() is not null
  );

create policy if not exists "schedules_manage_clinic" on public.doctor_schedules
  for all using (
    public.is_super_admin() or (
      public.is_medical_worker() and exists (
        select 1 from public.doctors d
        where d.id = doctor_id and d.clinic_id = public.current_clinic_id()
      )
    )
  ) with check (
    public.is_super_admin() or (
      public.is_medical_worker() and exists (
        select 1 from public.doctors d
        where d.id = doctor_id and d.clinic_id = public.current_clinic_id()
      )
    )
  );

create policy if not exists "rooms_read_all" on public.rooms
  for select using (
    public.is_super_admin() or public.is_medical_worker() or auth.uid() is not null
  );

create policy if not exists "rooms_manage_clinic" on public.rooms
  for all using (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    )
  ) with check (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    )
  );

create policy if not exists "appointments_read_clinic" on public.appointments
  for select using (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    ) or (
      public.is_patient() and patient_id = (
        select patient_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy if not exists "appointments_manage_clinic" on public.appointments
  for all using (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    )
  ) with check (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    )
  );

create policy if not exists "sos_read_clinic" on public.sos_alerts
  for select using (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    ) or (
      public.is_patient() and patient_id = (
        select patient_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy if not exists "sos_manage_clinic" on public.sos_alerts
  for all using (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    )
  ) with check (
    public.is_super_admin() or (
      public.is_medical_worker() and clinic_id = public.current_clinic_id()
    )
  );

-- Tables are ready for dashboard usage. The app will reference them through the existing Supabase client and provider layer.
