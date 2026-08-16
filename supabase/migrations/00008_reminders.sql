-- =====================================================================
-- CareLink — Migration 00008: Eslatmalar (reminders)
-- Dori-darmon, qabul, o'lchov va boshqa eslatmalar (minutlik cron uchun)
-- Idempotent
-- =====================================================================

create table if not exists public.reminders (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  type          text not null default 'medication'
                check (type in ('medication','appointment','measurement','other')),
  title         text not null,
  notes         text,
  -- kunlik takrorlash: vaqt (HH:MM)
  time_of_day   text,                    -- '08:00' ko'rinishida
  -- yoki har N daqiqada (minutlik cron)
  interval_minutes integer,
  -- bir martalik eslatma
  remind_once_at timestamptz,
  active        boolean not null default true,
  last_sent_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_reminders_client on public.reminders(client_id);
create index if not exists idx_reminders_active on public.reminders(active);

alter table public.reminders enable row level security;

drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own" on public.reminders
  for select using (client_id = auth.uid());

drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own" on public.reminders
  for insert with check (client_id = auth.uid());

drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own" on public.reminders
  for update using (client_id = auth.uid());

drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own" on public.reminders
  for delete using (client_id = auth.uid());

drop trigger if exists trg_audit_reminders on public.reminders;
create trigger trg_audit_reminders after insert or update or delete on public.reminders
  for each row execute function public.audit_trigger();
