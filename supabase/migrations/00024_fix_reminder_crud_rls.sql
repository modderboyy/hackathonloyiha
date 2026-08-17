-- =====================================================================
-- CareLink — Migration 00024
-- Patient manual reminders uchun edit/delete/toggle RLS tuzatishi.
-- =====================================================================

alter table public.reminders enable row level security;
drop policy if exists "reminders_select_own" on public.reminders;
drop policy if exists "reminders_insert_own" on public.reminders;
drop policy if exists "reminders_update_own" on public.reminders;
drop policy if exists "reminders_delete_own" on public.reminders;

create policy "reminders_select_own" on public.reminders
  for select using (client_id = auth.uid());
create policy "reminders_insert_own" on public.reminders
  for insert with check (client_id = auth.uid());
create policy "reminders_update_own" on public.reminders
  for update using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy "reminders_delete_own" on public.reminders
  for delete using (client_id = auth.uid());
