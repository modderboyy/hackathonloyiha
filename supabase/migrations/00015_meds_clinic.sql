-- =====================================================================
-- CareLink — Migration 00015: Dori-darmon jadvali + klinika boshqaruvi
-- Idempotent
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Dori-darmonlarga jadval (qabul rejimi) maydonlari
--    qabul chastotasi: har kuni / har soat, necha mahal, necha kun
-- ---------------------------------------------------------------------
alter table public.medications
  add column if not exists frequency_type text not null default 'daily'
  check (frequency_type in ('daily','hourly','weekly','as_needed'));
alter table public.medications
  add column if not exists times_per_day integer;       -- necha mahal
alter table public.medications
  add column if not exists interval_hours integer;      -- har necha soatda (hourly uchun)
alter table public.medications
  add column if not exists duration_days integer;       -- necha kun
alter table public.medications
  add column if not exists start_date date;             -- qachondan boshlab
alter table public.medications
  add column if not exists times text[];                -- aniq vaqtlar ['08:00','20:00']

-- ---------------------------------------------------------------------
-- 2. Klinika boshqaruvi (super admin uchun)
--    Har klinikaga email, parol (hash), obuna holati
-- ---------------------------------------------------------------------
alter table public.facilities
  add column if not exists email text;
alter table public.facilities
  add column if not exists password_hash text;          -- faqat server-side, hech qachon clientga berilmaydi
alter table public.facilities
  add column if not exists subscription_status text not null default 'inactive'
  check (subscription_status in ('active','inactive','expired','trial'));
alter table public.facilities
  add column if not exists subscription_expires_at timestamptz;
alter table public.facilities
  add column if not exists address text;
alter table public.facilities
  add column if not exists phone text;
alter table public.facilities
  add column if not exists radius_km numeric;           -- xizmat radiusi (xaritada ko'rsatiladi)

-- ---------------------------------------------------------------------
-- 3. Rollarni 3 tagacha soddalashtirish (UI uchun)
--    super_admin, medical_worker (tibbiyot xodimi), client (bemor)
--    eski rollar mavjud bo'lsa ham, ular medical_worker sifatida ko'riladi
--    (DB da saqlanib qoladi, lekin yangi UI faqat 3 rolni ko'rsatadi)
-- ---------------------------------------------------------------------

-- tibbiyot xodimi rolini tekshirish funksiyasi (barcha xodim rollarini qamrab oladi)
create or replace function public.is_medical_worker() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid()
                  and role in ('medical_worker','hospital_doctor','family_doctor','district_admin','clinic_admin','admin')) $$;

-- ---------------------------------------------------------------------
-- 4. Dori-darmonlarni bemorning reminders'iga sinxronlash uchun trigger funksiyasi
--    (har bir dori uchun eslatma avtomatik yaratiladi)
-- ---------------------------------------------------------------------
create or replace function public.on_medication_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_title text;
begin
  -- Bemor bilan bog'langan mijozni topish
  select id into v_client_id from profiles
  where patient_id = new.patient_id and role = 'client'
  limit 1;

  if v_client_id is null then
    return new;
  end if;

  v_title := '💊 ' || new.name;
  if new.dosage is not null then
    v_title := v_title || ' (' || new.dosage || ')';
  end if;

  -- Eslatma yaratish (reminders jadvaliga)
  insert into reminders (client_id, type, title, notes, time_of_day, interval_minutes, active)
  values (
    v_client_id,
    'medication',
    v_title,
    case
      when new.frequency is not null then new.frequency
      when new.times_per_day is not null then 'Kuniga ' || new.times_per_day || ' mahal'
      else 'Shifokor buyurgan'
    end,
    case when new.times is not null and array_length(new.times, 1) > 0 then new.times[1] else null end,
    case when new.frequency_type = 'hourly' and new.interval_hours is not null then new.interval_hours * 60 else null end,
    true
  );

  return new;
end;
$$;

drop trigger if exists trg_medication_created on public.medications;
create trigger trg_medication_created
  after insert on public.medications
  for each row execute function public.on_medication_created();
