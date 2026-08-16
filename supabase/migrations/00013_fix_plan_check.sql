-- =====================================================================
-- CareLink — Migration 00013: subscriptions plan cheklovini tuzatish
-- Muammo: plan faqat 'premium' edi, klinik obuna 'clinic' yozmoqchi
-- Tuzatish: 'individual' va 'clinic' plan qiymatlariga ruxsat
-- =====================================================================

-- Eski plan cheklovini topib o'chirish
do $$
declare
  v_constraint text;
begin
  for v_constraint in
    select conname from pg_constraint
    where conrelid = 'public.subscriptions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%plan%'
  loop
    execute format('alter table public.subscriptions drop constraint %I', v_constraint);
  end loop;
end;
$$;

-- Yangi cheklov (individual + clinic)
alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('premium','individual','clinic','basic'));
