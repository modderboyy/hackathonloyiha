-- =====================================================================
-- CareLink — Migration 00014: Klinika-based rollar + faollashtirish so'rovi
-- Endi davlat-based emas, klinika-based boshqaruv.
-- Har klinikaga o'z admini, faollashtirish super_admin tasdiqlashi orqali.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Profilga clinic_admin roli (har klinikaga o'z admini)
-- ---------------------------------------------------------------------
do $$
declare
  v_constraint text;
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass and conname = 'profiles_role_check'
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
  check (role in ('super_admin','admin','district_admin','clinic_admin','medical_worker','hospital_doctor','family_doctor','client'));

-- Profilga qaysi klinikaga tegishli ekanini belgilash
alter table public.profiles
  add column if not exists clinic_id uuid references public.facilities(id) on delete set null;
create index if not exists idx_profiles_clinic on public.profiles(clinic_id);

-- ---------------------------------------------------------------------
-- 2. Klinika faollashtirish so'rovi (clinic_activation_requests)
--    Klinika admini so'rov yuboradi → super_admin tasdiqlaydi/rad etadi
-- ---------------------------------------------------------------------
create table if not exists public.clinic_activation_requests (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.facilities(id) on delete cascade,
  requested_by  uuid references public.profiles(id) on delete set null,
  status        text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  reason        text,              -- nima uchun faollashtirish kerak
  decided_by    uuid references public.profiles(id) on delete set null,
  decided_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_car_status on public.clinic_activation_requests(status);

-- Klinika faol/faol emas holati
alter table public.facilities
  add column if not exists is_active boolean not null default false;
alter table public.facilities
  add column if not exists activated_at timestamptz;

-- ---------------------------------------------------------------------
-- 3. clinic_admin rol funksiyasi (RLS dan OLDIN yaratilishi kerak!)
-- ---------------------------------------------------------------------
create or replace function public.is_clinic_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'clinic_admin') $$;

create or replace function public.is_medical_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid()
                  and role in ('super_admin','admin','district_admin','clinic_admin','medical_worker','hospital_doctor','family_doctor')) $$;

-- ---------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------
alter table public.clinic_activation_requests enable row level security;

drop policy if exists "car_select" on public.clinic_activation_requests;
create policy "car_select" on public.clinic_activation_requests
  for select using (
    public.is_super_admin()
    or public.is_admin()
    or (public.is_clinic_admin() and clinic_id = (select clinic_id from profiles where id = auth.uid()))
    or requested_by = auth.uid()
  );

drop policy if exists "car_insert_clinic" on public.clinic_activation_requests;
create policy "car_insert_clinic" on public.clinic_activation_requests
  for insert with check (public.is_clinic_admin() or public.is_admin());

drop policy if exists "car_update_super" on public.clinic_activation_requests;
create policy "car_update_super" on public.clinic_activation_requests
  for update using (public.is_super_admin());

-- ---------------------------------------------------------------------
-- 5. Klinika faollashtirish RPC (super_admin tasdiqlaganda)
-- ---------------------------------------------------------------------
create or replace function public.approve_clinic_activation(p_request_id uuid, p_approve boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_uid uuid := auth.uid();
begin
  if not public.is_super_admin() then
    return jsonb_build_object('ok', false, 'error', 'Faqat super admin tasdiqlay oladi');
  end if;

  select * into v_request from clinic_activation_requests where id = p_request_id;
  if v_request.id is null then
    return jsonb_build_object('ok', false, 'error', 'So''rov topilmadi');
  end if;

  if p_approve then
    update facilities set is_active = true, activated_at = now() where id = v_request.clinic_id;
    update clinic_activation_requests set status = 'approved', decided_by = v_uid, decided_at = now() where id = p_request_id;
    return jsonb_build_object('ok', true, 'status', 'approved');
  else
    update clinic_activation_requests set status = 'rejected', decided_by = v_uid, decided_at = now() where id = p_request_id;
    return jsonb_build_object('ok', true, 'status', 'rejected');
  end if;
end;
$$;

grant execute on function public.approve_clinic_activation(p_request_id uuid, p_approve boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Klinika so'rov yuborish RPC (clinic_admin)
-- ---------------------------------------------------------------------
create or replace function public.request_clinic_activation(p_clinic_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing record;
begin
  if not (public.is_clinic_admin() or public.is_admin()) then
    return jsonb_build_object('ok', false, 'error', 'Ruxsat yo''q');
  end if;

  -- Kutilayotgan so'rov borligini tekshirish
  select * into v_existing from clinic_activation_requests
  where clinic_id = p_clinic_id and status = 'pending' limit 1;

  if v_existing.id is not null then
    return jsonb_build_object('ok', false, 'error', 'So''rov allaqachon yuborilgan, ko''rib chiqilmoqda');
  end if;

  insert into clinic_activation_requests (clinic_id, requested_by, status, reason)
  values (p_clinic_id, v_uid, 'pending', p_reason);

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.request_clinic_activation(p_clinic_id uuid, p_reason text) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Audit trigger
-- ---------------------------------------------------------------------
drop trigger if exists trg_audit_car on public.clinic_activation_requests;
create trigger trg_audit_car after insert or update on public.clinic_activation_requests
  for each row execute function public.audit_trigger();
