-- =====================================================================
-- CareLink — Migration 00016: clinic-first operatsion model
-- 3 rol: super_admin, medical_worker, patient
-- Klinikaga tegishli bemorlar, xavfsiz klinik obuna va dori-eslatma sync
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Rollarni uchta aniq rolga soddalashtirish
-- ---------------------------------------------------------------------
do $$
declare
  v_constraint text;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', v_constraint);
  end loop;
end;
$$;

update public.profiles
set role = case
  when role = 'super_admin' then 'super_admin'
  when role in ('client', 'patient') then 'patient'
  else 'medical_worker'
end;

alter table public.profiles alter column role set default 'patient';
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'medical_worker', 'patient'));

-- Yangi auth foydalanuvchi metadata orqali faqat patient yoki medical_worker bo'ladi.
-- Super admin faqat xavfsiz server-side provisioning orqali beriladi.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'patient');
begin
  if v_role not in ('patient', 'medical_worker') then
    v_role := 'patient';
  end if;

  insert into public.profiles (
    id, full_name, first_name, last_name, birth_date, phone, role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Klinika kartasi va joylashuvi
-- ---------------------------------------------------------------------
alter table public.facilities
  add column if not exists lat numeric(9,6),
  add column if not exists lng numeric(9,6),
  add column if not exists radius_km numeric(6,2) default 3,
  add column if not exists email text,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists is_active boolean not null default false,
  add column if not exists address text,
  add column if not exists phone text;

-- Muvofiqlik uchun klinika `active` bo'lsa, oldingi is_active flag ham active bo'ladi.
update public.facilities
set is_active = true
where subscription_status in ('active', 'trial') and is_active = false;

-- `password_hash` avvalgi migratsiyada bor bo'lishi mumkin. U faqat server tomonda
-- ishlatiladi; oddiy parol hech qachon facilities jadvalida saqlanmaydi.
alter table public.facilities add column if not exists password_hash text;

-- ---------------------------------------------------------------------
-- 3. Har bir bemorni klinikaga bog'lash
-- ---------------------------------------------------------------------
alter table public.patients
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null;
create index if not exists idx_patients_clinic on public.patients(clinic_id);

alter table public.clinical_visits
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null;
alter table public.hospitalizations
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null;
alter table public.discharges
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null,
  add column if not exists diagnosis text;
alter table public.follow_ups
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null;

-- Eski facility_id yozuvlari bo'lsa clinic_id ni ular bilan to'ldirish.
update public.patients p
set clinic_id = pr.clinic_id
from public.profiles pr
where p.clinic_id is null and p.created_by = pr.id and pr.clinic_id is not null;

update public.hospitalizations set clinic_id = facility_id
where clinic_id is null and facility_id is not null;
update public.clinical_visits set clinic_id = facility_id
where clinic_id is null and facility_id is not null;
update public.discharges d
set clinic_id = h.clinic_id
from public.hospitalizations h
where d.clinic_id is null and d.hospitalization_id = h.id;
update public.follow_ups f
set clinic_id = d.clinic_id
from public.discharges d
where f.clinic_id is null and f.discharge_id = d.id;

create or replace function public.current_clinic_id()
returns uuid
language sql stable security definer set search_path = public as
$$ select clinic_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin') $$;

create or replace function public.is_medical_worker()
returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'medical_worker') $$;

create or replace function public.is_patient()
returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'patient') $$;

create or replace function public.can_access_patient(p_patient_id uuid)
returns boolean
language sql stable security definer set search_path = public as
$$
  select public.is_super_admin()
    or exists (
      select 1 from public.patients p
      where p.id = p_patient_id
        and p.clinic_id = public.current_clinic_id()
        and public.is_medical_worker()
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role = 'patient' and pr.patient_id = p_patient_id
    )
$$;

-- Eski keng ruxsatlarni almashtirish: xodim faqat o'z klinikasidagi bemorni ko'radi.
drop policy if exists "patients_select_staff" on public.patients;
drop policy if exists "patients_insert_staff" on public.patients;
drop policy if exists "patients_update_staff" on public.patients;
drop policy if exists "patients_delete_staff" on public.patients;
create policy "patients_clinic_read" on public.patients
  for select using (public.can_access_patient(id));
create policy "patients_clinic_insert" on public.patients
  for insert with check (
    public.is_super_admin()
    or (public.is_medical_worker() and clinic_id = public.current_clinic_id())
  );
create policy "patients_clinic_update" on public.patients
  for update using (public.can_access_patient(id))
  with check (public.is_super_admin() or clinic_id = public.current_clinic_id());
create policy "patients_clinic_delete" on public.patients
  for delete using (public.is_super_admin() or (public.is_medical_worker() and clinic_id = public.current_clinic_id()));

-- Klinikadan keladigan tibbiy yozuvlar uchun bemor-scoped RLS.
drop policy if exists "visits_select_staff" on public.clinical_visits;
drop policy if exists "visits_insert_staff" on public.clinical_visits;
drop policy if exists "visits_update_staff" on public.clinical_visits;
create policy "visits_clinic_read" on public.clinical_visits for select using (public.can_access_patient(patient_id));
create policy "visits_clinic_insert" on public.clinical_visits for insert with check (
  public.is_super_admin() or (public.is_medical_worker() and clinic_id = public.current_clinic_id())
);
create policy "visits_clinic_update" on public.clinical_visits for update using (public.can_access_patient(patient_id));

drop policy if exists "hosp_select_staff" on public.hospitalizations;
drop policy if exists "hosp_insert_staff" on public.hospitalizations;
drop policy if exists "hosp_update_staff" on public.hospitalizations;
create policy "hosp_clinic_read" on public.hospitalizations for select using (public.can_access_patient(patient_id));
create policy "hosp_clinic_insert" on public.hospitalizations for insert with check (
  public.is_super_admin() or (public.is_medical_worker() and clinic_id = public.current_clinic_id())
);
create policy "hosp_clinic_update" on public.hospitalizations for update using (public.can_access_patient(patient_id));

drop policy if exists "discharges_select_staff" on public.discharges;
drop policy if exists "discharges_insert_staff" on public.discharges;
create policy "discharges_clinic_read" on public.discharges for select using (public.can_access_patient(patient_id));
create policy "discharges_clinic_insert" on public.discharges for insert with check (
  public.is_super_admin() or (public.is_medical_worker() and clinic_id = public.current_clinic_id())
);

drop policy if exists "followups_select_staff" on public.follow_ups;
drop policy if exists "followups_insert_staff" on public.follow_ups;
drop policy if exists "followups_update_staff" on public.follow_ups;
create policy "followups_clinic_read" on public.follow_ups for select using (public.can_access_patient(patient_id));
create policy "followups_clinic_insert" on public.follow_ups for insert with check (
  public.is_super_admin() or (public.is_medical_worker() and clinic_id = public.current_clinic_id())
);
create policy "followups_clinic_update" on public.follow_ups for update using (public.can_access_patient(patient_id));

-- Klinika katalogi: super admin hammasini, xodim faqat o'zinikini ko'radi.
drop policy if exists "facilities_read_staff" on public.facilities;
drop policy if exists "facilities_super_admin_all" on public.facilities;
create policy "facilities_clinic_read" on public.facilities for select using (
  public.is_super_admin() or id = public.current_clinic_id() or auth.uid() is not null
);
create policy "facilities_super_admin_all" on public.facilities for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------
-- 4. AI uchun klinik discharge kontekstini bemor profiliga sinxronlash
-- ---------------------------------------------------------------------
alter table public.client_health
  add column if not exists hospital_diagnosis text,
  add column if not exists treatment_summary text,
  add column if not exists discharge_recommendations text,
  add column if not exists clinical_updated_at timestamptz;

-- upsert ishlashi uchun client_id bitta bo'lishi kerak.
delete from public.client_health a
using public.client_health b
where a.client_id = b.client_id
  and (a.created_at < b.created_at or (a.created_at = b.created_at and a.id < b.id));
create unique index if not exists idx_client_health_one_per_client on public.client_health(client_id);

create or replace function public.sync_patient_care_context(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_discharge record;
  v_diagnosis text;
begin
  select id into v_client_id
  from public.profiles
  where patient_id = p_patient_id and role = 'patient'
  order by created_at desc
  limit 1;

  if v_client_id is null then return; end if;

  select * into v_discharge
  from public.discharges
  where patient_id = p_patient_id
  order by discharge_date desc, created_at desc
  limit 1;

  if v_discharge.id is null then return; end if;

  select coalesce(v_discharge.diagnosis, h.diagnosis) into v_diagnosis
  from public.hospitalizations h
  where h.id = v_discharge.hospitalization_id;

  insert into public.client_health (
    client_id, current_condition, hospital_diagnosis, treatment_summary,
    discharge_recommendations, clinical_updated_at
  ) values (
    v_client_id, v_diagnosis, v_diagnosis, v_discharge.summary,
    v_discharge.recommendations, now()
  )
  on conflict (client_id) do update set
    current_condition = excluded.current_condition,
    hospital_diagnosis = excluded.hospital_diagnosis,
    treatment_summary = excluded.treatment_summary,
    discharge_recommendations = excluded.discharge_recommendations,
    clinical_updated_at = excluded.clinical_updated_at,
    updated_at = now();
end;
$$;

create or replace function public.on_discharge_context_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.sync_patient_care_context(new.patient_id);
  return new;
end;
$$;

drop trigger if exists trg_discharge_context_sync on public.discharges;
create trigger trg_discharge_context_sync
  after insert or update of diagnosis, summary, recommendations on public.discharges
  for each row execute function public.on_discharge_context_sync();

-- ---------------------------------------------------------------------
-- 5. Chiqarishdan keyingi kuzatuvni klinika ichida avtomatik ochish
-- ---------------------------------------------------------------------
create or replace function public.on_discharge_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc uuid;
  v_patient_name text;
  v_clinic uuid := coalesce(new.clinic_id, (select clinic_id from public.hospitalizations where id = new.hospitalization_id));
begin
  v_doc := new.assigned_family_doctor_id;
  if v_doc is null and v_clinic is not null then
    select id into v_doc from public.profiles
    where role = 'medical_worker' and clinic_id = v_clinic
    order by created_at
    limit 1;
  end if;

  -- Xodim hali biriktirilmagan bo'lsa ham follow-up yaratiladi: super admin
  -- yoki klinika keyin uni qabul qilishi mumkin, care vazifasi esa yo'qolmaydi.
  if new.requires_follow_up then
    insert into public.follow_ups (
      patient_id, discharge_id, clinic_id, family_doctor_id, due_date, status
    ) values (
      new.patient_id, new.id, v_clinic, v_doc,
      new.discharge_date + coalesce(new.follow_up_days, 7), 'pending'
    );
  end if;

  if v_doc is not null then
    select full_name into v_patient_name from public.patients where id = new.patient_id;
    insert into public.notifications (recipient_id, type, title, body, patient_id)
    values (
      v_doc, 'follow_up', 'Yangi kuzatuv vazifasi',
      'Bemor ' || coalesce(v_patient_name, 'noma''lum') || ' statsionardan chiqarildi.',
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
-- 6. Dori jadvali -> reminders avtomatik sinxronlash
-- ---------------------------------------------------------------------
alter table public.reminders
  add column if not exists medication_id uuid references public.medications(id) on delete cascade,
  add column if not exists source text not null default 'manual',
  add column if not exists ends_at date;
create index if not exists idx_reminders_medication on public.reminders(medication_id);

create or replace function public.sync_medication_reminders(p_medication_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_med public.medications%rowtype;
  v_client_id uuid;
  v_time text;
  v_times text[];
  v_title text;
  v_notes text;
  v_end date;
  i integer;
begin
  select * into v_med from public.medications where id = p_medication_id;
  if v_med.id is null then
    delete from public.reminders where medication_id = p_medication_id;
    return;
  end if;

  select id into v_client_id
  from public.profiles
  where patient_id = v_med.patient_id and role = 'patient'
  order by created_at desc
  limit 1;

  delete from public.reminders where medication_id = p_medication_id;
  if v_client_id is null then return; end if;

  v_title := '💊 ' || v_med.name || case when v_med.dosage is not null then ' — ' || v_med.dosage else '' end;
  v_notes := coalesce(v_med.notes, '') || case when v_med.frequency is not null then E'\n' || v_med.frequency else '' end;
  v_end := coalesce(v_med.start_date, current_date) + greatest(coalesce(v_med.duration_days, 30) - 1, 0);

  if v_med.frequency_type = 'hourly' then
    insert into public.reminders (client_id, medication_id, source, type, title, notes, interval_minutes, ends_at, active)
    values (
      v_client_id, v_med.id, 'medication', 'medication', v_title, v_notes,
      greatest(coalesce(v_med.interval_hours, 1), 1) * 60, v_end, true
    );
    return;
  end if;

  v_times := v_med.times;
  if v_times is null or array_length(v_times, 1) is null then
    -- Aniq vaqt tanlanmagan bo'lsa, mahal soniga qarab xavfsiz standartlar.
    v_times := case coalesce(v_med.times_per_day, 1)
      when 1 then array['08:00']
      when 2 then array['08:00', '20:00']
      when 3 then array['08:00', '14:00', '20:00']
      when 4 then array['06:00', '12:00', '18:00', '22:00']
      else array['08:00']
    end;
  end if;

  foreach v_time in array v_times loop
    insert into public.reminders (client_id, medication_id, source, type, title, notes, time_of_day, ends_at, active)
    values (v_client_id, v_med.id, 'medication', 'medication', v_title, v_notes, v_time, v_end, true);
  end loop;
end;
$$;

create or replace function public.sync_patient_medication_reminders(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  for v_id in select id from public.medications where patient_id = p_patient_id loop
    perform public.sync_medication_reminders(v_id);
  end loop;
end;
$$;

create or replace function public.on_medication_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    delete from public.reminders where medication_id = old.id;
    return old;
  end if;
  perform public.sync_medication_reminders(new.id);
  return new;
end;
$$;

drop trigger if exists trg_medication_created on public.medications;
drop trigger if exists trg_medication_sync on public.medications;
create trigger trg_medication_sync
  after insert or update or delete on public.medications
  for each row execute function public.on_medication_sync();

-- Bemor klinik kod orqali bog'langanda ham eski dori rejasi va discharge xulosasi sinxronlanadi.
create or replace function public.activate_clinic_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hosp record;
  v_sub jsonb;
  v_expiry date;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Avtorizatsiya kerak'); end if;

  select h.* into v_hosp from public.hospitalizations h
  where upper(h.code) = upper(trim(p_code)) limit 1;
  if v_hosp.id is null then return jsonb_build_object('ok', false, 'error', 'Kod topilmadi'); end if;

  v_expiry := coalesce(v_hosp.end_date, current_date + 30);
  if v_expiry < current_date then
    return jsonb_build_object('ok', false, 'error', 'Kod muddati tugagan. Klinikaga murojaat qiling.');
  end if;

  if not exists (
    select 1 from public.facilities
    where id = v_hosp.facility_id
      and is_active = true
      and subscription_status in ('active', 'trial')
      and (subscription_expires_at is null or subscription_expires_at > now())
  ) then
    return jsonb_build_object('ok', false, 'error', 'Klinika obunasi faol emas. Klinikaga murojaat qiling.');
  end if;

  update public.profiles set patient_id = v_hosp.patient_id, role = 'patient' where id = v_uid;
  update public.subscriptions set status = 'expired'
  where client_id = v_uid and type = 'clinic' and status = 'active';

  insert into public.subscriptions (
    client_id, type, clinic_id, hospitalization_id, clinic_code,
    plan, price_usd, status, started_at, expires_at
  ) values (
    v_uid, 'clinic', v_hosp.facility_id, v_hosp.id, upper(trim(p_code)),
    'clinic', 0.00, 'active', now(), v_expiry
  ) returning to_jsonb(subscriptions) into v_sub;

  perform public.sync_patient_care_context(v_hosp.patient_id);
  perform public.sync_patient_medication_reminders(v_hosp.patient_id);
  return jsonb_build_object('ok', true, 'subscription', v_sub);
end;
$$;

grant execute on function public.activate_clinic_code(text) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Patient mobile app va clinic-scoped RLS
-- ---------------------------------------------------------------------
create or replace function public.is_medical_staff()
returns boolean
language sql stable security definer set search_path = public as
$$ select public.is_super_admin() or public.is_medical_worker() $$;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "medications_select_own" on public.medications;
drop policy if exists "medications_insert_staff" on public.medications;
drop policy if exists "medications_clinic_read" on public.medications;
drop policy if exists "medications_clinic_insert" on public.medications;
create policy "medications_clinic_read" on public.medications
  for select using (public.can_access_patient(patient_id));
create policy "medications_clinic_insert" on public.medications
  for insert with check (
    public.is_super_admin()
    or (public.is_medical_worker() and public.can_access_patient(patient_id))
  );

drop policy if exists "health_select_own" on public.client_health;
create policy "health_select_patient_or_clinic" on public.client_health
  for select using (
    client_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = client_id and p.patient_id is not null and public.can_access_patient(p.patient_id)
    )
  );

drop policy if exists "checkins_select_own" on public.checkins;
create policy "checkins_select_patient_or_clinic" on public.checkins
  for select using (
    client_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = client_id and p.patient_id is not null and public.can_access_patient(p.patient_id)
    )
  );

drop policy if exists "subs_select_own" on public.subscriptions;
create policy "subs_select_patient_or_super" on public.subscriptions
  for select using (client_id = auth.uid() or public.is_super_admin());

drop policy if exists "facilities_write_admin" on public.facilities;
