-- =====================================================================
-- CareLink — Migration 00005: Ixtisosliklar, AI yo'naltirish va joylashuv
-- Idempotent — qayta ishga tushirish xavfsiz
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Ixtisosliklar (specialties)
-- ---------------------------------------------------------------------
create table if not exists public.specialties (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  created_at  timestamptz not null default now()
);

insert into public.specialties (name, code) values
  ('Terapiya (Umumiy)', 'terapiya'),
  ('Pediatriya (Bolalar)', 'pediatriya'),
  ('Stomatologiya (Tish)', 'stomatologiya'),
  ('Kardiologiya (Yurak)', 'kardiologiya'),
  ('Nevrologiya (Asab)', 'nevrologiya'),
  ('Oftalmologiya (Ko''z)', 'oftalmologiya'),
  ('LOR (Quloq-burun-tomoq)', 'lor'),
  ('Ginekologiya', 'ginekologiya'),
  ('Dermatologiya (Teri)', 'dermatologiya')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 2. Profillarga ixtisoslik
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists specialty_id uuid references public.specialties(id) on delete set null;

-- ---------------------------------------------------------------------
-- 3. Tuman va mahallalarga joylashuv (xaritadan tanlash)
-- ---------------------------------------------------------------------
alter table public.districts
  add column if not exists lat numeric;
alter table public.districts
  add column if not exists lng numeric;
alter table public.neighborhoods
  add column if not exists lat numeric;
alter table public.neighborhoods
  add column if not exists lng numeric;

-- ---------------------------------------------------------------------
-- 4. Bemorlarga tuman/mahalla bog'lash (xaritada raqam uchun)
-- ---------------------------------------------------------------------
alter table public.patients
  add column if not exists district_id uuid references public.districts(id) on delete set null;
alter table public.patients
  add column if not exists neighborhood_id uuid references public.neighborhoods(id) on delete set null;
create index if not exists idx_patients_district on public.patients(district_id);

-- ---------------------------------------------------------------------
-- 5. Klinik tashriflarga AI yo'naltirish
-- ---------------------------------------------------------------------
alter table public.clinical_visits
  add column if not exists specialty text;
alter table public.clinical_visits
  add column if not exists routed_to uuid references public.profiles(id) on delete set null;
alter table public.clinical_visits
  add column if not exists status text not null default 'open'
  check (status in ('open','routed','in_progress','done'));

-- ---------------------------------------------------------------------
-- 6. RLS — specialties hamma xodim o'qiy oladi, admin yozadi
-- ---------------------------------------------------------------------
alter table public.specialties enable row level security;

drop policy if exists "specialties_read_staff" on public.specialties;
create policy "specialties_read_staff" on public.specialties
  for select using (public.is_medical_staff());

drop policy if exists "specialties_write_admin" on public.specialties;
create policy "specialties_write_admin" on public.specialties
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. Audit trigger
-- ---------------------------------------------------------------------
drop trigger if exists trg_audit_specialties on public.specialties;
create trigger trg_audit_specialties after insert or update or delete on public.specialties
  for each row execute function public.audit_trigger();
