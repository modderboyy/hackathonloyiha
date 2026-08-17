-- =====================================================================
-- CareLink — Migration 00023
-- SOS queue code va bemor tomonidan qisqa muddatda cancel qilish.
-- =====================================================================

alter table public.sos_alerts
  add column if not exists queue_code text;

-- Avvalgi alertlar uchun ham queue code bo'lsin.
update public.sos_alerts
set queue_code = 'SOS-' || upper(substr(replace(id::text, '-', ''), 1, 6))
where queue_code is null;

alter table public.sos_alerts
  alter column queue_code set not null;

create unique index if not exists idx_sos_alerts_queue_code
  on public.sos_alerts(queue_code);

-- User cancel holatini qabul qilish.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.sos_alerts'::regclass
      and conname = 'sos_alerts_status_check'
  ) then
    alter table public.sos_alerts drop constraint sos_alerts_status_check;
  end if;
end;
$$;

alter table public.sos_alerts
  add constraint sos_alerts_status_check
  check (status in ('open', 'accepted', 'resolved', 'cancelled'));
