-- =====================================================================
-- CareLink — Migration 00020
-- Optional vitals → AI health profile, beta monitoring interval va test push.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Bemorning monitoring sozlamalari (beta test: 1, 5, 10... minut)
-- ---------------------------------------------------------------------
create table if not exists public.patient_monitoring_settings (
  client_id        uuid primary key references public.profiles(id) on delete cascade,
  enabled          boolean not null default true,
  interval_minutes integer not null default 60 check (interval_minutes between 1 and 1440),
  last_checkin_at  timestamptz,
  updated_at       timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

alter table public.patient_monitoring_settings enable row level security;
drop policy if exists "monitoring_settings_select_own" on public.patient_monitoring_settings;
drop policy if exists "monitoring_settings_insert_own" on public.patient_monitoring_settings;
drop policy if exists "monitoring_settings_update_own" on public.patient_monitoring_settings;
create policy "monitoring_settings_select_own" on public.patient_monitoring_settings
  for select using (client_id = auth.uid());
create policy "monitoring_settings_insert_own" on public.patient_monitoring_settings
  for insert with check (client_id = auth.uid());
create policy "monitoring_settings_update_own" on public.patient_monitoring_settings
  for update using (client_id = auth.uid()) with check (client_id = auth.uid());

create or replace function public.set_monitoring_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_monitoring_settings_updated on public.patient_monitoring_settings;
create trigger trg_monitoring_settings_updated
  before update on public.patient_monitoring_settings
  for each row execute function public.set_monitoring_settings_updated_at();

-- ---------------------------------------------------------------------
-- 2. So'nggi vital ko'rsatkichlarini client_health (AI konteksti)ga sync
-- ---------------------------------------------------------------------
create or replace function public.sync_patient_care_context(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_discharge record;
  v_vital record;
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

  select * into v_vital
  from public.vitals
  where patient_id = p_patient_id
  order by measured_at desc, created_at desc
  limit 1;

  if v_discharge.id is null and v_vital.id is null then return; end if;

  if v_discharge.id is not null then
    select coalesce(v_discharge.diagnosis, h.diagnosis) into v_diagnosis
    from public.hospitalizations h
    where h.id = v_discharge.hospitalization_id;
  end if;

  insert into public.client_health (
    client_id, current_condition, hospital_diagnosis, treatment_summary,
    discharge_recommendations, avg_bp_sys, avg_bp_dia, avg_heart_rate,
    avg_temperature, avg_spo2, avg_weight, clinical_updated_at
  ) values (
    v_client_id,
    v_diagnosis,
    v_diagnosis,
    case when v_discharge.id is null then null else v_discharge.summary end,
    case when v_discharge.id is null then null else v_discharge.recommendations end,
    case when v_vital.id is null then null else v_vital.bp_sys end,
    case when v_vital.id is null then null else v_vital.bp_dia end,
    case when v_vital.id is null then null else v_vital.heart_rate end,
    case when v_vital.id is null then null else v_vital.temperature end,
    case when v_vital.id is null then null else v_vital.spo2 end,
    case when v_vital.id is null then null else v_vital.weight end,
    case when v_discharge.id is null then null else now() end
  )
  on conflict (client_id) do update set
    current_condition = coalesce(excluded.current_condition, client_health.current_condition),
    hospital_diagnosis = coalesce(excluded.hospital_diagnosis, client_health.hospital_diagnosis),
    treatment_summary = coalesce(excluded.treatment_summary, client_health.treatment_summary),
    discharge_recommendations = coalesce(excluded.discharge_recommendations, client_health.discharge_recommendations),
    avg_bp_sys = coalesce(excluded.avg_bp_sys, client_health.avg_bp_sys),
    avg_bp_dia = coalesce(excluded.avg_bp_dia, client_health.avg_bp_dia),
    avg_heart_rate = coalesce(excluded.avg_heart_rate, client_health.avg_heart_rate),
    avg_temperature = coalesce(excluded.avg_temperature, client_health.avg_temperature),
    avg_spo2 = coalesce(excluded.avg_spo2, client_health.avg_spo2),
    avg_weight = coalesce(excluded.avg_weight, client_health.avg_weight),
    clinical_updated_at = coalesce(excluded.clinical_updated_at, client_health.clinical_updated_at),
    updated_at = now();
end;
$$;

create or replace function public.on_vitals_ai_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.sync_patient_care_context(new.patient_id);
  return new;
end;
$$;

drop trigger if exists trg_vitals_ai_sync on public.vitals;
create trigger trg_vitals_ai_sync
  after insert or update on public.vitals
  for each row execute function public.on_vitals_ai_sync();

-- ---------------------------------------------------------------------
-- 3. Bemor yaratish vaqtida optional vitals qabul qiladigan xavfsiz RPC
-- ---------------------------------------------------------------------
create or replace function public.create_clinic_patient(
  p_full_name text,
  p_pinfl text default null,
  p_birth_date date default null,
  p_gender text default null,
  p_phone text default null,
  p_address text default null,
  p_emergency_contact text default null,
  p_clinic_id uuid default null,
  p_bp_sys integer default null,
  p_bp_dia integer default null,
  p_heart_rate integer default null,
  p_temperature numeric default null,
  p_spo2 integer default null,
  p_weight numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient public.patients%rowtype;
  v_vital public.vitals%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Avtorizatsiya kerak');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Bemorning to''liq ism-familiyasi majburiy');
  end if;
  if p_gender is not null and p_gender not in ('male', 'female', 'other') then
    return jsonb_build_object('ok', false, 'error', 'Jins qiymati noto''g''ri');
  end if;
  if not public.can_create_clinic_patient(p_clinic_id) then
    return jsonb_build_object('ok', false, 'error', 'Siz bu klinikaga bemor qo''shish huquqiga ega emassiz');
  end if;

  insert into public.patients (
    full_name, pinfl, birth_date, gender, phone, address,
    emergency_contact, clinic_id, created_by
  ) values (
    trim(p_full_name), nullif(trim(p_pinfl), ''), p_birth_date, p_gender,
    nullif(trim(p_phone), ''), nullif(trim(p_address), ''),
    nullif(trim(p_emergency_contact), ''), p_clinic_id, auth.uid()
  ) returning * into v_patient;

  if p_bp_sys is not null or p_bp_dia is not null or p_heart_rate is not null
    or p_temperature is not null or p_spo2 is not null or p_weight is not null then
    insert into public.vitals (
      patient_id, recorded_by, bp_sys, bp_dia, heart_rate,
      temperature, spo2, weight, measured_at
    ) values (
      v_patient.id, auth.uid(), p_bp_sys, p_bp_dia, p_heart_rate,
      p_temperature, p_spo2, p_weight, now()
    ) returning * into v_vital;
  end if;

  perform public.sync_patient_care_context(v_patient.id);
  return jsonb_build_object('ok', true, 'patient', to_jsonb(v_patient), 'vital', to_jsonb(v_vital));
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'Bu JSHSHIR bilan bemor allaqachon mavjud');
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.create_clinic_patient(text, text, date, text, text, text, text, uuid, integer, integer, integer, numeric, integer, numeric) to authenticated;
