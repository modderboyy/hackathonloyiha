-- =====================================================================
-- CareLink — Migration 00009: Obuna turlari (B2C individual + B2B klinik)
-- + klinik kod (statsionar ID) + dori-darmon jadvali + bemor bog'lash
-- Idempotent
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Statsionarga: qisqa kod + tugash sanasi
-- ---------------------------------------------------------------------
alter table public.hospitalizations
  add column if not exists code text unique;
alter table public.hospitalizations
  add column if not exists end_date date;  -- kutilayotgan chiqarish sanasi

-- Mavjud statsionarlarga kod generatsiya (faqat kod bo'lmaganlarga)
update public.hospitalizations
set code = upper(substr(md5(id::text), 1, 8))
where code is null;

-- ---------------------------------------------------------------------
-- 2. Profilni bemor (patient) yozuviga bog'lash
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists patient_id uuid references public.patients(id) on delete set null;
create index if not exists idx_profiles_patient on public.profiles(patient_id);

-- ---------------------------------------------------------------------
-- 3. Dori-darmon jadvali (bemorga bog'liq — klinikadan sinxronlanadi)
-- ---------------------------------------------------------------------
create table if not exists public.medications (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  name        text not null,
  dosage      text,
  frequency   text,                 -- 'kuniga 2 mahal', 'ertalab'...
  notes       text,
  prescribed_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_medications_patient on public.medications(patient_id);

alter table public.medications enable row level security;
drop policy if exists "medications_select_own" on public.medications;
create policy "medications_select_own" on public.medications
  for select using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or public.is_medical_staff()
  );
drop policy if exists "medications_insert_staff" on public.medications;
create policy "medications_insert_staff" on public.medications
  for insert with check (public.is_medical_staff());

-- ---------------------------------------------------------------------
-- 4. Obuna jadvaliga tur va klinik bog'lash
-- ---------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists type text not null default 'individual'
  check (type in ('individual','clinic'));
alter table public.subscriptions
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null;
alter table public.subscriptions
  add column if not exists hospitalization_id uuid references public.hospitalizations(id) on delete set null;
alter table public.subscriptions
  add column if not exists clinic_code text;

create index if not exists idx_subs_type on public.subscriptions(type);

-- ---------------------------------------------------------------------
-- 5. Klinik kodni faollashtirish funksiyasi (RPC)
--    Kod = statsionar (hospitalization) kodi
--    Mijoz profilini bemor yozuviga bog'laydi + klinik obuna yaratadi
-- ---------------------------------------------------------------------
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
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Avtorizatsiya kerak');
  end if;

  -- Kod bo'yicha statsionarni topish (katta/kichik harfga sezgir emas)
  select h.* into v_hosp
  from hospitalizations h
  where upper(h.code) = upper(trim(p_code))
    and h.status = 'active'
  limit 1;

  if v_hosp.id is null then
    return jsonb_build_object('ok', false, 'error', 'Kod topilmadi yoki statsionar muddati tugagan');
  end if;

  -- Mijozni bemorga bog'lash
  update profiles set patient_id = v_hosp.patient_id where id = v_uid;

  -- Eskilarini o'chirish (faqat klinik turini) va yangi klinik obuna
  update subscriptions set status = 'expired'
  where client_id = v_uid and type = 'clinic' and status = 'active';

  insert into subscriptions (client_id, type, clinic_id, hospitalization_id, clinic_code, plan, price_usd, status, started_at, expires_at)
  values (
    v_uid,
    'clinic',
    v_hosp.facility_id,
    v_hosp.id,
    upper(trim(p_code)),
    'clinic',
    0.00,
    'active',
    now(),
    coalesce(v_hosp.end_date, current_date + 30)
  )
  returning to_jsonb(subscriptions) into v_sub;

  return jsonb_build_object('ok', true, 'subscription', v_sub);
end;
$$;

grant execute on function public.activate_clinic_code(p_code text) to authenticated;

-- ---------------------------------------------------------------------
-- 6. RLS: foydalanuvchi klinikalarni ko'rishi (kod tanlash uchun)
-- ---------------------------------------------------------------------
drop policy if exists "facilities_read_staff" on public.facilities;
create policy "facilities_read_staff" on public.facilities
  for select using (public.is_medical_staff() or auth.uid() is not null);
