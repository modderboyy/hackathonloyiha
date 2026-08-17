-- =====================================================================
-- CareLink — Migration 00017
-- Klinika xodimi va super admin uchun bemor qo'shish RLS tuzatishi.
-- Bu migratsiya eski facility_id ma'lumotlarini clinic_id bilan ham moslaydi.
-- =====================================================================

-- Eski sxema bilan moslik: clinic_id yangi bo'lsa ham qo'shiladi.
alter table public.profiles
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null;
alter table public.patients
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null;

create index if not exists idx_patients_clinic on public.patients(clinic_id);
create index if not exists idx_profiles_clinic on public.profiles(clinic_id);

-- Oldingi versiyada xodim facility_id ga bog'langan bo'lishi mumkin.
update public.profiles
set clinic_id = facility_id
where clinic_id is null and facility_id is not null;

-- Bemor yaratish uchun haqiqiy klinikani olish (yangi clinic_id yoki eski facility_id).
create or replace function public.current_patient_writer_clinic()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(clinic_id, facility_id)
  from public.profiles
  where id = auth.uid()
$$;

-- Bu funksiya RLS va RPC ikkalasida ham bir xil ruxsat qoidasini ishlatadi.
create or replace function public.can_create_clinic_patient(p_clinic_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_clinic_id uuid;
begin
  if auth.uid() is null or p_clinic_id is null then
    return false;
  end if;

  select role, coalesce(clinic_id, facility_id)
  into v_role, v_clinic_id
  from public.profiles
  where id = auth.uid();

  if v_role = 'super_admin' then
    return true;
  end if;

  -- Legacy rollar ham vaqtincha tibbiyot xodimi deb qabul qilinadi.
  if v_role in ('medical_worker', 'clinic_admin', 'hospital_doctor', 'family_doctor', 'admin', 'district_admin') then
    return v_clinic_id is not null and v_clinic_id = p_clinic_id;
  end if;

  return false;
end;
$$;

-- To'g'ridan-to'g'ri insert qilinsa ham klinika doirasi buzilmaydi.
alter table public.patients enable row level security;
drop policy if exists "patients_insert_staff" on public.patients;
drop policy if exists "patients_clinic_insert" on public.patients;
drop policy if exists "patients_insert_clinic_scope" on public.patients;
create policy "patients_insert_clinic_scope" on public.patients
  for insert
  with check (public.can_create_clinic_patient(clinic_id));

-- Client tarafdagi insert RLS bilan to'xtab qolmasligi uchun xavfsiz RPC.
-- Funksiya auth.uid, rol va klinika bog'lanishini o'zi tekshiradi.
create or replace function public.create_clinic_patient(
  p_full_name text,
  p_pinfl text default null,
  p_birth_date date default null,
  p_gender text default null,
  p_phone text default null,
  p_address text default null,
  p_emergency_contact text default null,
  p_clinic_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient public.patients%rowtype;
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
  )
  returning * into v_patient;

  return jsonb_build_object('ok', true, 'patient', to_jsonb(v_patient));
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'Bu JSHSHIR bilan bemor allaqachon mavjud');
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.create_clinic_patient(text, text, date, text, text, text, text, uuid) to authenticated;
