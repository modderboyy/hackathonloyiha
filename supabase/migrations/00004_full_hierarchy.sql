-- =====================================================================
-- CareLink — Migration 00004: TO'LIQ ierarxiya + adminlar + tasdiqlash
-- 00002 va 00003 o'rnini bosadi. Idempotent — qayta ishga tushirish xavfsiz.
-- (00002/00003 qisman yoki to'liq bajarilgan bo'lsa ham xatosiz ishlaydi)
-- =====================================================================

-- =====================================================================
-- 1. ROLE CHECK — mavjud cheklovni tozalab, yangisini qo'yamiz
-- =====================================================================
do $$
declare
  v_constraint text;
begin
  -- a) nomlangan cheklov (00002 dan)
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_role_check'
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;

  -- b) boshqa qolgan role CHECK cheklovlarini topib o'chirish
  for v_constraint in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%medical_worker%'
  loop
    execute format('alter table public.profiles drop constraint %I', v_constraint);
  end loop;
end;
$$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin','admin','district_admin','medical_worker','hospital_doctor','family_doctor'));

-- =====================================================================
-- 2. Ma'muriy birliklar jadvallari
-- =====================================================================
create table if not exists public.districts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  region_id   uuid not null references public.regions(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists idx_districts_region on public.districts(region_id);

create table if not exists public.neighborhoods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  district_id uuid not null references public.districts(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists idx_neighborhoods_district on public.neighborhoods(district_id);

create table if not exists public.streets (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  neighborhood_id  uuid not null references public.neighborhoods(id) on delete cascade,
  created_at       timestamptz not null default now()
);
create index if not exists idx_streets_neighborhood on public.streets(neighborhood_id);

create table if not exists public.buildings (
  id          uuid primary key default gen_random_uuid(),
  number      text not null,
  name        text,
  street_id   uuid not null references public.streets(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists idx_buildings_street on public.buildings(street_id);

-- =====================================================================
-- 3. Profillarga hududiy scope
-- =====================================================================
alter table public.profiles
  add column if not exists district_id uuid references public.districts(id) on delete set null;
alter table public.profiles
  add column if not exists neighborhood_id uuid references public.neighborhoods(id) on delete set null;

create index if not exists idx_profiles_district on public.profiles(district_id);
create index if not exists idx_profiles_neighborhood on public.profiles(neighborhood_id);

-- =====================================================================
-- 4. Tasdiqlash (approvals)
-- =====================================================================
create table if not exists public.approvals (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null default 'staff_join'
                      check (type in ('staff_join','district_assign','other')),
  title               text not null,
  payload             jsonb not null default '{}',
  district_id         uuid references public.districts(id) on delete set null,
  region_id           uuid references public.regions(id) on delete set null,
  submitted_by        uuid references public.profiles(id) on delete set null,
  status              text not null default 'pending_region'
                      check (status in ('pending_region','pending_republic','approved','rejected')),
  region_decision     text check (region_decision in ('approve','reject')),
  region_decided_by   uuid references public.profiles(id) on delete set null,
  region_decided_at   timestamptz,
  republic_decision   text check (republic_decision in ('approve','reject')),
  republic_decided_by uuid references public.profiles(id) on delete set null,
  republic_decided_at timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists idx_approvals_status on public.approvals(status);
create index if not exists idx_approvals_region on public.approvals(region_id);

-- =====================================================================
-- 5. Rol funksiyalari
-- =====================================================================
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role in ('super_admin','admin')) $$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin') $$;

create or replace function public.is_district_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'district_admin') $$;

create or replace function public.is_medical_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid()
                  and role in ('super_admin','admin','district_admin','medical_worker','hospital_doctor','family_doctor')) $$;

-- =====================================================================
-- 6. RLS — yangi jadvallar
-- =====================================================================
alter table public.districts      enable row level security;
alter table public.neighborhoods  enable row level security;
alter table public.streets        enable row level security;
alter table public.buildings      enable row level security;
alter table public.approvals      enable row level security;

drop policy if exists "districts_read_staff" on public.districts;
create policy "districts_read_staff" on public.districts
  for select using (public.is_medical_staff());

drop policy if exists "districts_write_admin" on public.districts;
create policy "districts_write_admin" on public.districts
  for all using (public.is_admin() or public.is_district_admin())
  with check (public.is_admin() or public.is_district_admin());

drop policy if exists "neighborhoods_read_staff" on public.neighborhoods;
create policy "neighborhoods_read_staff" on public.neighborhoods
  for select using (public.is_medical_staff());

drop policy if exists "neighborhoods_write_admin" on public.neighborhoods;
create policy "neighborhoods_write_admin" on public.neighborhoods
  for all using (public.is_admin() or public.is_district_admin())
  with check (public.is_admin() or public.is_district_admin());

drop policy if exists "streets_read_staff" on public.streets;
create policy "streets_read_staff" on public.streets
  for select using (public.is_medical_staff());

drop policy if exists "streets_write_admin" on public.streets;
create policy "streets_write_admin" on public.streets
  for all using (public.is_admin() or public.is_district_admin())
  with check (public.is_admin() or public.is_district_admin());

drop policy if exists "buildings_read_staff" on public.buildings;
create policy "buildings_read_staff" on public.buildings
  for select using (public.is_medical_staff());

drop policy if exists "buildings_write_admin" on public.buildings;
create policy "buildings_write_admin" on public.buildings
  for all using (public.is_admin() or public.is_district_admin())
  with check (public.is_admin() or public.is_district_admin());

drop policy if exists "approvals_read" on public.approvals;
create policy "approvals_read" on public.approvals
  for select using (
    submitted_by = auth.uid()
    or public.is_super_admin()
    or (public.is_admin() and region_id = (select region_id from profiles where id = auth.uid()))
    or (public.is_district_admin() and district_id = (select district_id from profiles where id = auth.uid()))
  );

drop policy if exists "approvals_insert_admin" on public.approvals;
create policy "approvals_insert_admin" on public.approvals
  for insert with check (public.is_admin() or public.is_district_admin());

drop policy if exists "approvals_update_admin" on public.approvals;
create policy "approvals_update_admin" on public.approvals
  for update using (public.is_admin() or public.is_district_admin() or public.is_super_admin());

-- profiles SELECT — hamkasblarni ko'rish (agar eski siyosat qolgan bo'lsa)
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles
  for select using (public.is_medical_staff());

-- =====================================================================
-- 7. Audit trigger (approvals uchun)
-- =====================================================================
drop trigger if exists trg_audit_approvals on public.approvals;
create trigger trg_audit_approvals after insert or update or delete on public.approvals
  for each row execute function public.audit_trigger();

-- =====================================================================
-- 8. Birinchi super adminni tayinlash (emailni almashtiring!)
-- =====================================================================
-- update public.profiles
-- set role = 'super_admin'
-- where id = (select id from auth.users where email = 'admin@carelink.uz' limit 1);
