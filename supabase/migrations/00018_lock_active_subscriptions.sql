-- =====================================================================
-- CareLink — Migration 00018
-- Faol obuna bo'lsa bemor boshqa obuna tanlay/yoki o'zgartira olmasligi.
-- Individual va klinik obuna faqat bitta faol holatda bo'ladi.
-- =====================================================================

create or replace function public.has_active_subscription(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.client_id = p_client_id
      and s.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
  )
$$;

-- Bemor clientdan subscriptions jadvalini bevosita o'zgartira olmaydi.
-- Faollashtirish faqat quyidagi security-definer RPC lar orqali bo'ladi.
alter table public.subscriptions enable row level security;
drop policy if exists "subs_select_own" on public.subscriptions;
drop policy if exists "subs_select_patient_or_super" on public.subscriptions;
drop policy if exists "subs_insert_own" on public.subscriptions;
drop policy if exists "subs_update_own" on public.subscriptions;
drop policy if exists "subs_insert_via_rpc" on public.subscriptions;

create policy "subscriptions_read_own_or_super" on public.subscriptions
  for select using (
    client_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

-- Demo individual checkout RPC. Hozir aktiv subscription bo'lsa hech qanday
-- yangi row yaratmaydi va plan/expiry o'zgarmaydi.
create or replace function public.activate_individual_demo_subscription()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sub jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Avtorizatsiya kerak');
  end if;

  -- Bir vaqtning o'zida kelgan ikki checkout yangi aktiv row yaratmasin.
  perform pg_advisory_xact_lock(hashtext(v_uid::text));
  if public.has_active_subscription(v_uid) then
    return jsonb_build_object('ok', false, 'error', 'Sizda faol obuna bor. Obunani o''zgartirish mumkin emas.');
  end if;

  insert into public.subscriptions (
    client_id, type, plan, price_usd, currency, status, started_at, expires_at
  ) values (
    v_uid, 'individual', 'premium', 5.00, 'USD', 'active', now(), now() + interval '30 days'
  )
returning to_jsonb(subscriptions) into v_sub;

  return jsonb_build_object('ok', true, 'subscription', v_sub);
end;
$$;

grant execute on function public.activate_individual_demo_subscription() to authenticated;

-- Klinik kod aktivlashishi ham faol individual/klinik obunani almashtira olmaydi.
create or replace function public.activate_clinic_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hosp record;
  v_sub jsonb;
  v_expiry date;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Avtorizatsiya kerak'); end if;

  perform pg_advisory_xact_lock(hashtext(v_uid::text));
  if public.has_active_subscription(v_uid) then
    return jsonb_build_object('ok', false, 'error', 'Sizda faol obuna bor. Uni o''zgartirish yoki yangi klinik kod ulash mumkin emas.');
  end if;

  select h.* into v_hosp from public.hospitalizations h
  where upper(h.code) = upper(trim(p_code)) limit 1;
  if v_hosp.id is null then return jsonb_build_object('ok', false, 'error', 'Kod topilmadi'); end if;

  v_expiry := coalesce(v_hosp.end_date, current_date + 30);
  if v_expiry < current_date then
    return jsonb_build_object('ok', false, 'error', 'Kod muddati tugagan. Klinikaga murojaat qiling.');
  end if;

  if not exists (
    select 1 from public.facilities
    where id = v_hosp.facility_id
      and is_active = true
      and subscription_status in ('active', 'trial')
      and (subscription_expires_at is null or subscription_expires_at > now())
  ) then
    return jsonb_build_object('ok', false, 'error', 'Klinika obunasi faol emas. Klinikaga murojaat qiling.');
  end if;

  update public.profiles set patient_id = v_hosp.patient_id, role = 'patient' where id = v_uid;

  insert into public.subscriptions (
    client_id, type, clinic_id, hospitalization_id, clinic_code,
    plan, price_usd, status, started_at, expires_at
  ) values (
    v_uid, 'clinic', v_hosp.facility_id, v_hosp.id, upper(trim(p_code)),
    'clinic', 0.00, 'active', now(), v_expiry
  ) returning to_jsonb(public.subscriptions) into v_sub;

  perform public.sync_patient_care_context(v_hosp.patient_id);
  perform public.sync_patient_medication_reminders(v_hosp.patient_id);
  return jsonb_build_object('ok', true, 'subscription', v_sub);
end;
$$;

grant execute on function public.activate_clinic_code(text) to authenticated;
