-- =====================================================================
-- CareLink — Raqamli tibbiy kuzatuv platformasi
-- Migration 00001: Asosiy sxema, jadvallar, RLS va triggerlar
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. Hududlar (regions)
-- ---------------------------------------------------------------------
create table if not exists public.regions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Tibbiyot muassasalari (facilities)
-- ---------------------------------------------------------------------
create table if not exists public.facilities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('polyclinic','hospital','family_clinic','other')),
  region_id   uuid references public.regions(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_facilities_region on public.facilities(region_id);

-- ---------------------------------------------------------------------
-- 4. Profillar (auth.users bilan bog'langan)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'medical_worker'
              check (role in ('admin','medical_worker','hospital_doctor','family_doctor')),
  phone       text,
  facility_id uuid references public.facilities(id) on delete set null,
  region_id   uuid references public.regions(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_region on public.profiles(region_id);

-- Yordamchi funksiya: joriy foydalanuvchi roli (profiles jadvalidan keyin)
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Yangi foydalanuvchi ro'yxatdan o'tganda avtomatik profil yaratish
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. Bemorlar (patients)
-- ---------------------------------------------------------------------
create table if not exists public.patients (
  id                 uuid primary key default gen_random_uuid(),
  pinfl              text unique,             -- JSHSHIR (ixtiyoriy)
  full_name          text not null,
  birth_date         date,
  gender             text check (gender in ('male','female','other')),
  phone              text,                    -- bemorda smartfon bo'lmasligi mumkin
  region_id          uuid references public.regions(id) on delete set null,
  address            text,
  emergency_contact  text,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_patients_region on public.patients(region_id);
create index if not exists idx_patients_name on public.patients(full_name);

-- ---------------------------------------------------------------------
-- 6. Klinik tashriflar (clinical_visits) — Clinical Intake
-- ---------------------------------------------------------------------
create table if not exists public.clinical_visits (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references public.patients(id) on delete cascade,
  facility_id       uuid references public.facilities(id) on delete set null,
  doctor_id         uuid references public.profiles(id) on delete set null,
  chief_complaint   text,
  diagnosis         text,                     -- ishchi tashxis
  notes             text,
  recommendations   text,
  visit_date        timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists idx_visits_patient on public.clinical_visits(patient_id);

-- ---------------------------------------------------------------------
-- 7. Hayotiy ko'rsatkichlar (vitals)
-- ---------------------------------------------------------------------
create table if not exists public.vitals (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references public.patients(id) on delete cascade,
  visit_id          uuid references public.clinical_visits(id) on delete set null,
  recorded_by       uuid references public.profiles(id) on delete set null,
  bp_sys            integer,                  -- sistolik bosim
  bp_dia            integer,                  -- diastolik bosim
  heart_rate        integer,                  -- puls
  temperature       numeric(4,1),             -- harorat
  spo2              integer,                  -- qon kislorod darajasi
  weight            numeric(5,1),             -- vazn (kg)
  measured_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists idx_vitals_patient on public.vitals(patient_id);

-- ---------------------------------------------------------------------
-- 8. Statsionar davolanish (hospitalizations)
-- ---------------------------------------------------------------------
create table if not exists public.hospitalizations (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references public.patients(id) on delete cascade,
  facility_id       uuid references public.facilities(id) on delete set null,
  doctor_id         uuid references public.profiles(id) on delete set null,
  admission_date    date not null default current_date,
  diagnosis         text,
  status            text not null default 'active' check (status in ('active','discharged')),
  created_at        timestamptz not null default now()
);

create index if not exists idx_hosp_patient on public.hospitalizations(patient_id);

-- ---------------------------------------------------------------------
-- 9. Chiqarish va yo'naltirish (discharges) — Discharge & Referral
-- ---------------------------------------------------------------------
create table if not exists public.discharges (
  id                       uuid primary key default gen_random_uuid(),
  hospitalization_id       uuid not null references public.hospitalizations(id) on delete cascade,
  patient_id               uuid not null references public.patients(id) on delete cascade,
  doctor_id                uuid references public.profiles(id) on delete set null,
  discharge_date           date not null default current_date,
  summary                  text,
  recommendations          text,
  requires_follow_up       boolean not null default false,
  follow_up_days           integer,           -- necha kun ichida kuzatuv kerak
  assigned_family_doctor_id uuid references public.profiles(id) on delete set null,
  created_at               timestamptz not null default now()
);

create index if not exists idx_discharges_patient on public.discharges(patient_id);

-- ---------------------------------------------------------------------
-- 10. Kuzatuvlar (follow_ups) — Follow-up
-- ---------------------------------------------------------------------
create table if not exists public.follow_ups (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references public.patients(id) on delete cascade,
  discharge_id      uuid references public.discharges(id) on delete set null,
  family_doctor_id  uuid references public.profiles(id) on delete set null,
  due_date          date not null,
  status            text not null default 'pending'
                    check (status in ('pending','in_progress','completed','overdue')),
  result_notes      text,
  next_step         text,
  completed_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists idx_followups_doctor on public.follow_ups(family_doctor_id);
create index if not exists idx_followups_patient on public.follow_ups(patient_id);

-- ---------------------------------------------------------------------
-- 11. Xabarnomalar (notifications)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  type          text not null default 'info'
                check (type in ('info','follow_up','discharge','alert')),
  title         text not null,
  body          text,
  patient_id    uuid references public.patients(id) on delete set null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notif_recipient on public.notifications(recipient_id);

-- ---------------------------------------------------------------------
-- 12. Audit jurnali (audit_log)
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity      text,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_user on public.audit_log(user_id);
create index if not exists idx_audit_created on public.audit_log(created_at);

-- =====================================================================
-- 13. Row Level Security (RLS)
-- =====================================================================
alter table public.regions          enable row level security;
alter table public.facilities       enable row level security;
alter table public.profiles         enable row level security;
alter table public.patients         enable row level security;
alter table public.clinical_visits  enable row level security;
alter table public.vitals           enable row level security;
alter table public.hospitalizations enable row level security;
alter table public.discharges       enable row level security;
alter table public.follow_ups       enable row level security;
alter table public.notifications    enable row level security;
alter table public.audit_log        enable row level security;

-- rollar yordamchi funksiyalari
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.is_medical_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid()
                  and role in ('admin','medical_worker','hospital_doctor','family_doctor')) $$;

-- ------------------------- regions -------------------------
create policy "regions_read_staff" on public.regions
  for select using (public.is_medical_staff());
create policy "regions_write_admin" on public.regions
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------- facilities -------------------------
create policy "facilities_read_staff" on public.facilities
  for select using (public.is_medical_staff());
create policy "facilities_write_admin" on public.facilities
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------- profiles -------------------------
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------- patients -------------------------
create policy "patients_select_staff" on public.patients
  for select using (public.is_medical_staff());
create policy "patients_insert_staff" on public.patients
  for insert with check (public.is_medical_staff());
create policy "patients_update_staff" on public.patients
  for update using (public.is_medical_staff()) with check (public.is_medical_staff());

-- ------------------------- clinical_visits -------------------------
create policy "visits_select_staff" on public.clinical_visits
  for select using (public.is_medical_staff());
create policy "visits_insert_staff" on public.clinical_visits
  for insert with check (public.is_medical_staff());
create policy "visits_update_staff" on public.clinical_visits
  for update using (public.is_medical_staff()) with check (public.is_medical_staff());

-- ------------------------- vitals -------------------------
create policy "vitals_select_staff" on public.vitals
  for select using (public.is_medical_staff());
create policy "vitals_insert_staff" on public.vitals
  for insert with check (public.is_medical_staff());

-- ------------------------- hospitalizations -------------------------
create policy "hosp_select_staff" on public.hospitalizations
  for select using (public.is_medical_staff());
create policy "hosp_insert_staff" on public.hospitalizations
  for insert with check (public.is_medical_staff());
create policy "hosp_update_staff" on public.hospitalizations
  for update using (public.is_medical_staff()) with check (public.is_medical_staff());

-- ------------------------- discharges -------------------------
create policy "discharges_select_staff" on public.discharges
  for select using (public.is_medical_staff());
create policy "discharges_insert_staff" on public.discharges
  for insert with check (public.is_medical_staff());

-- ------------------------- follow_ups -------------------------
create policy "followups_select_staff" on public.follow_ups
  for select using (public.is_medical_staff());
create policy "followups_insert_staff" on public.follow_ups
  for insert with check (public.is_medical_staff());
create policy "followups_update_staff" on public.follow_ups
  for update using (public.is_medical_staff()) with check (public.is_medical_staff());

-- ------------------------- notifications -------------------------
create policy "notif_select_own" on public.notifications
  for select using (recipient_id = auth.uid() or public.is_admin());
create policy "notif_insert_staff" on public.notifications
  for insert with check (public.is_medical_staff());
create policy "notif_update_own" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- ------------------------- audit_log -------------------------
create policy "audit_select_admin" on public.audit_log
  for select using (public.is_admin());
create policy "audit_insert_all" on public.audit_log
  for insert with check (auth.uid() is not null);

-- =====================================================================
-- 14. Triggerlar
-- =====================================================================

-- updated_at avtomatik yangilash
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_patients_updated on public.patients;
create trigger trg_patients_updated before update on public.patients
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Discharge yaratilganda: follow-up + oilaviy shifokorga xabarnoma
-- ---------------------------------------------------------------------
create or replace function public.on_discharge_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_region uuid;
  v_doc uuid;
  v_patient_name text;
begin
  -- bemorning hududini olish
  select region_id into v_region from public.patients where id = new.patient_id;

  -- shu hududdagi oilaviy shifokorni topish (yoki tayinlangan shifokor)
  v_doc := new.assigned_family_doctor_id;
  if v_doc is null and v_region is not null then
    select id into v_doc from public.profiles
    where role = 'family_doctor' and region_id = v_region
    order by created_at limit 1;
  end if;

  -- follow-up kerak bo'lsa, kuzatuv yaratish
  if new.requires_follow_up and v_doc is not null then
    insert into public.follow_ups (patient_id, discharge_id, family_doctor_id, due_date, status)
    values (
      new.patient_id,
      new.id,
      v_doc,
      new.discharge_date + coalesce(new.follow_up_days, 7),
      'pending'
    );
  end if;

  -- oilaviy shifokorga xabarnoma
  if v_doc is not null then
    select full_name into v_patient_name from public.patients where id = new.patient_id;
    insert into public.notifications (recipient_id, type, title, body, patient_id)
    values (
      v_doc,
      'follow_up',
      'Yangi kuzatuv so''rovi',
      'Bemor ' || coalesce(v_patient_name, 'noma''lum') || ' statsionardan chiqarildi va keyingi kuzatuvga muhtoj.',
      new.patient_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_discharge_created on public.discharges;
create trigger trg_discharge_created
  after insert on public.discharges
  for each row execute function public.on_discharge_created();

-- ---------------------------------------------------------------------
-- Audit jurnaliga yozish (asosiy jadvallar uchun)
-- ---------------------------------------------------------------------
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (user_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    (case when tg_op = 'DELETE' then old.id else new.id end),
    jsonb_build_object('table', tg_table_name)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_patients on public.patients;
create trigger trg_audit_patients after insert or update or delete on public.patients
  for each row execute function public.audit_trigger();

drop trigger if exists trg_audit_discharges on public.discharges;
create trigger trg_audit_discharges after insert or update or delete on public.discharges
  for each row execute function public.audit_trigger();

drop trigger if exists trg_audit_followups on public.follow_ups;
create trigger trg_audit_followups after insert or update or delete on public.follow_ups
  for each row execute function public.audit_trigger();
