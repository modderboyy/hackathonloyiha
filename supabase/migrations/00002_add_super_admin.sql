-- =====================================================================
-- CareLink — Migration 00002: super_admin roli qo'shish (tuzatish)
-- Eski 00001 ni allaqachon ishga tushirganlar uchun incremental fix.
-- Yangi o'rnatishda faqat 00001 yetarli.
-- =====================================================================

-- 1. Eski CHECK cheklovini olib tashlash (nomi noma'lum bo'lishi mumkin, shuning uchun din amik topamiz)
do $$
declare
  v_constraint text;
begin
  select conname into v_constraint
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%super_admin%' is false
    and pg_get_constraintdef(oid) like '%medical_worker%';

  if v_constraint is not null then
    execute format('alter table public.profiles drop constraint %I', v_constraint);
  end if;
end;
$$;

-- 2. Yangi CHECK — super_admin bilan
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin','admin','medical_worker','hospital_doctor','family_doctor'));

-- 3. is_admin() — super_admin ham admin huquqiga ega
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role in ('super_admin','admin')) $$;

-- 4. is_medical_staff() — super_admin kiritilgan
create or replace function public.is_medical_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid()
                  and role in ('super_admin','admin','medical_worker','hospital_doctor','family_doctor')) $$;

-- 5. profiles SELECT siyosatini kengaytirish (hamkasblarni ko'rish)
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_staff" on public.profiles
  for select using (public.is_medical_staff());

-- 6. Birinchi super adminni tayinlash (emailni almashtiring!)
-- update public.profiles
-- set role = 'super_admin'
-- where id = (
--   select id from auth.users where email = 'admin@carelink.uz' limit 1
-- );
