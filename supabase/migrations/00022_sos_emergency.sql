-- =====================================================================
-- CareLink — Migration 00022
-- SOS alertlar, klinika xabarnomasi va yaqin odamga location bilan SMS.
-- =====================================================================

create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  clinic_id uuid references public.facilities(id) on delete set null,
  priority text not null default 'high' check (priority in ('critical', 'high', 'moderate')),
  status text not null default 'open' check (status in ('open', 'accepted', 'resolved')),
  location_lat numeric(9, 6),
  location_lng numeric(9, 6),
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sos_alerts_clinic on public.sos_alerts(clinic_id);
create index if not exists idx_sos_alerts_status on public.sos_alerts(status);
create index if not exists idx_sos_alerts_patient on public.sos_alerts(patient_id);

-- Yaqin odam koordinatasi berilsa Edge Function haqiqiy masofa bo'yicha tanlaydi.
alter table public.family_members
  add column if not exists location_lat numeric(9, 6),
  add column if not exists location_lng numeric(9, 6);

alter table public.sos_alerts enable row level security;
drop policy if exists "sos_alerts_patient_read" on public.sos_alerts;
drop policy if exists "sos_alerts_clinic_read" on public.sos_alerts;
create policy "sos_alerts_patient_read" on public.sos_alerts
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.patient_id = sos_alerts.patient_id
    )
  );
create policy "sos_alerts_clinic_read" on public.sos_alerts
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.role = 'super_admin' or coalesce(p.clinic_id, p.facility_id) = sos_alerts.clinic_id)
    )
  );

-- Realtime dashboard / klinika xabarnomasi uchun SOS jadvalini ham yoqamiz.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_rel pr
      join pg_publication p on p.oid = pr.prpubid
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'sos_alerts'
    ) then
    alter publication supabase_realtime add table public.sos_alerts;
  end if;
end;
$$;
