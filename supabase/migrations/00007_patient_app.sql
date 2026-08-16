-- =====================================================================
-- CareLink — Migration 00007: Mijoz (bemor) ilovasi
-- Premium obuna, sog'liq ma'lumotlari, soatlik AI tekshiruv (check-in)
-- Idempotent — qayta ishga tushirish xavfsiz
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 'client' (mijoz) rolini qo'shish
-- ---------------------------------------------------------------------
do $$
declare
  v_constraint text;
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_role_check'
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
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
  check (role in ('super_admin','admin','district_admin','medical_worker','hospital_doctor','family_doctor','client'));

-- ---------------------------------------------------------------------
-- 2. Premium obunalar (subscriptions)
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  plan        text not null default 'premium' check (plan in ('premium')),
  price_usd   numeric(8,2) not null default 5.00,
  currency    text not null default 'USD',
  status      text not null default 'active'
              check (status in ('active','cancelled','expired','pending')),
  started_at  timestamptz not null default now(),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_subs_client on public.subscriptions(client_id);
create index if not exists idx_subs_status on public.subscriptions(status);

-- ---------------------------------------------------------------------
-- 3. Mijoz sog'liq ma'lumotlari (client_health)
-- ---------------------------------------------------------------------
create table if not exists public.client_health (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.profiles(id) on delete cascade,
  current_condition text,              -- hozirgi kasallik (ixtiyoriy, lekin muhim)
  medical_notes     text,              -- qo'shimcha tibbiy izohlar
  allergies         text,
  medications       text,
  -- o'rtacha hayotiy ko'rsatkichlar (ixtiyoriy)
  avg_bp_sys        integer,
  avg_bp_dia        integer,
  avg_heart_rate    integer,
  avg_temperature   numeric(4,1),
  avg_spo2          integer,
  avg_weight        numeric(5,1),
  emergency_contact text,              -- favqulodda aloqa (SMS/telefon uchun)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_health_client on public.client_health(client_id);

-- ---------------------------------------------------------------------
-- 4. Soatlik tekshiruvlar (checkins) — AI monitoring
-- ---------------------------------------------------------------------
create table if not exists public.checkins (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  scheduled_at    timestamptz not null default now(),
  ai_message      text,               -- OpenAI yaratgan shaxsiy savol
  status          text not null default 'sent'
                  check (status in ('sent','answered_fine','answered_bad','sms_sent','locked','escalated')),
  response        text,               -- mijoz javobi (yaxshiman/yomonman/batafsil)
  responded_at    timestamptz,
  escalation      integer not null default 0,  -- 0=sent, 1=sms, 2=locked
  created_at      timestamptz not null default now()
);
create index if not exists idx_checkins_client on public.checkins(client_id);
create index if not exists idx_checkins_status on public.checkins(status);

-- ---------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------
alter table public.subscriptions enable row level security;
alter table public.client_health enable row level security;
alter table public.checkins enable row level security;

-- Mijoz faqat o'zining obunasi/sog'lig'i/tekshiruvini ko'radi
drop policy if exists "subs_select_own" on public.subscriptions;
create policy "subs_select_own" on public.subscriptions
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "subs_insert_own" on public.subscriptions;
create policy "subs_insert_own" on public.subscriptions
  for insert with check (client_id = auth.uid());

drop policy if exists "subs_update_own" on public.subscriptions;
create policy "subs_update_own" on public.subscriptions
  for update using (client_id = auth.uid() or public.is_admin());

drop policy if exists "health_select_own" on public.client_health;
create policy "health_select_own" on public.client_health
  for select using (client_id = auth.uid() or public.is_medical_staff());

drop policy if exists "health_insert_own" on public.client_health;
create policy "health_insert_own" on public.client_health
  for insert with check (client_id = auth.uid());

drop policy if exists "health_update_own" on public.client_health;
create policy "health_update_own" on public.client_health
  for update using (client_id = auth.uid());

drop policy if exists "checkins_select_own" on public.checkins;
create policy "checkins_select_own" on public.checkins
  for select using (client_id = auth.uid() or public.is_medical_staff());

drop policy if exists "checkins_insert_own" on public.checkins;
create policy "checkins_insert_own" on public.checkins
  for insert with check (client_id = auth.uid());

drop policy if exists "checkins_update_own" on public.checkins;
create policy "checkins_update_own" on public.checkins
  for update using (client_id = auth.uid());

-- ---------------------------------------------------------------------
-- 6. Triggerlar
-- ---------------------------------------------------------------------
drop trigger if exists trg_health_updated on public.client_health;
create trigger trg_health_updated before update on public.client_health
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_subs on public.subscriptions;
create trigger trg_audit_subs after insert or update or delete on public.subscriptions
  for each row execute function public.audit_trigger();
