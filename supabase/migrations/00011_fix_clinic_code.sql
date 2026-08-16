-- =====================================================================
-- CareLink — Migration 00011: klinik kod tekshiruvini tuzatish
-- Muammo: RPC 'status=active' qidirardi, lekin discharge'da status 'discharged'
-- Tuzatish: statusga qaramay, faqat muddat (end_date) bo'yicha tekshiramiz
-- =====================================================================

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
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Avtorizatsiya kerak');
  end if;

  -- Kod bo'yicha statsionarni topish (statusga qaramay, muddatga qarab)
  select h.* into v_hosp
  from hospitalizations h
  where upper(h.code) = upper(trim(p_code))
  limit 1;

  if v_hosp.id is null then
    return jsonb_build_object('ok', false, 'error', 'Kod topilmadi');
  end if;

  -- Muddatni aniqlash (end_date yoki 30 kun standart)
  v_expiry := coalesce(v_hosp.end_date, current_date + 30);

  -- Muddat tugagan bo'lsa rad etish
  if v_expiry < current_date then
    return jsonb_build_object('ok', false, 'error', 'Kod muddati tugagan. Iltimos klinikangizga murojaat qiling.');
  end if;

  -- Mijozni bemorga bog'lash
  update profiles set patient_id = v_hosp.patient_id where id = v_uid;

  -- Eskilarini o'chirish va yangi klinik obuna
  update subscriptions set status = 'expired'
  where client_id = v_uid and type = 'clinic' and status = 'active';

  insert into subscriptions (client_id, type, clinic_id, hospitalization_id, clinic_code, plan, price_usd, status, started_at, expires_at)
  values (
    v_uid,
    'clinic',
    v_hosp.facility_id,
    v_hosp.id,
    upper(trim(p_code)),
    'clinic',
    0.00,
    'active',
    now(),
    v_expiry
  )
  returning to_jsonb(subscriptions) into v_sub;

  return jsonb_build_object('ok', true, 'subscription', v_sub);
end;
$$;

grant execute on function public.activate_clinic_code(p_code text) to authenticated;
