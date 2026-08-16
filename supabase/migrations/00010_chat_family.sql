-- =====================================================================
-- CareLink — Migration 00010: Chat xabarlar + oila a'zolari + eskalatsiya
-- Idempotent
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Chat xabarlar (AI suhbatlari — database + lokal sinxron uchun)
-- ---------------------------------------------------------------------
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_chat_client on public.chat_messages(client_id, created_at desc);

alter table public.chat_messages enable row level security;
drop policy if exists "chat_select_own" on public.chat_messages;
create policy "chat_select_own" on public.chat_messages
  for select using (client_id = auth.uid());
drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages
  for insert with check (client_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2. Oila a'zolari (favqulodda eskalatsiya uchun, yaqinlik tartibida)
-- ---------------------------------------------------------------------
create table if not exists public.family_members (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  phone         text not null,
  relationship  text,               -- 'ona','ota','farzand','turmush o'rtog'i'...
  priority      integer not null default 1,  -- 1 = eng yaqin
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_family_client on public.family_members(client_id, priority);

alter table public.family_members enable row level security;
drop policy if exists "family_select_own" on public.family_members;
create policy "family_select_own" on public.family_members
  for select using (client_id = auth.uid());
drop policy if exists "family_insert_own" on public.family_members;
create policy "family_insert_own" on public.family_members
  for insert with check (client_id = auth.uid());
drop policy if exists "family_update_own" on public.family_members;
create policy "family_update_own" on public.family_members
  for update using (client_id = auth.uid());
drop policy if exists "family_delete_own" on public.family_members;
create policy "family_delete_own" on public.family_members
  for delete using (client_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. Checkins: oila eskalatsiya bosqichini kuzatish
-- ---------------------------------------------------------------------
alter table public.checkins
  add column if not exists family_step integer not null default 0;  -- nechta a'zoga yuborildi
alter table public.checkins
  add column if not exists family_notified_at timestamptz;

-- ---------------------------------------------------------------------
-- 4. OneSignal player ID (push uchun)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists onesignal_id text;

-- ---------------------------------------------------------------------
-- 5. Audit trigger
-- ---------------------------------------------------------------------
drop trigger if exists trg_audit_chat on public.chat_messages;
create trigger trg_audit_chat after insert on public.chat_messages
  for each row execute function public.audit_trigger();
