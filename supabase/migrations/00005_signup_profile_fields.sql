-- =====================================================================
-- CareLink — Migration 00005: signup uchun kerakli profil maydonlari
-- =====================================================================

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birth_date date;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    first_name,
    last_name,
    birth_date,
    region_id,
    district_id,
    neighborhood_id
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', null),
    coalesce(new.raw_user_meta_data ->> 'last_name', null),
    case when new.raw_user_meta_data ->> 'birth_date' is not null then (new.raw_user_meta_data ->> 'birth_date')::date else null end,
    case when new.raw_user_meta_data ->> 'region_id' is not null then (new.raw_user_meta_data ->> 'region_id')::uuid else null end,
    case when new.raw_user_meta_data ->> 'district_id' is not null then (new.raw_user_meta_data ->> 'district_id')::uuid else null end,
    case when new.raw_user_meta_data ->> 'neighborhood_id' is not null then (new.raw_user_meta_data ->> 'neighborhood_id')::uuid else null end
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    birth_date = coalesce(excluded.birth_date, public.profiles.birth_date),
    region_id = coalesce(excluded.region_id, public.profiles.region_id),
    district_id = coalesce(excluded.district_id, public.profiles.district_id),
    neighborhood_id = coalesce(excluded.neighborhood_id, public.profiles.neighborhood_id);

  return new;
end;
$$;
