-- =====================================================================
-- CareLink — Migration 00019
-- Push notification tarixini public.notifications da bemor uchun saqlash.
-- =====================================================================

alter table public.notifications
  add column if not exists source text not null default 'system';

create index if not exists idx_notifications_recipient_created
  on public.notifications(recipient_id, created_at desc);

alter table public.notifications enable row level security;

-- Bemor faqat o'z push/xabar tarixini ko'radi va o'qilgan deb belgilaydi.
drop policy if exists "notif_select_own" on public.notifications;
drop policy if exists "notifications_read_own" on public.notifications;
create policy "notifications_read_own" on public.notifications
  for select using (
    recipient_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists "notif_update_own" on public.notifications;
drop policy if exists "notifications_mark_read_own" on public.notifications;
create policy "notifications_mark_read_own" on public.notifications
  for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Edge Function/service-role push tarixini yozadi. Klinik xodimlar uchun
-- mavjud staff insert policy saqlanadi; bemor clientdan bevosita insert ruxsati yo'q.
