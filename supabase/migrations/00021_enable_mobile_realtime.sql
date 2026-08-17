-- =====================================================================
-- CareLink — Migration 00021
-- Flutter mobile/web Realtime streamlari uchun kerakli jadvallarni
-- supabase_realtime publication'iga qo'shadi.
-- =====================================================================

do $$
declare
  v_table text;
begin
  -- Hosted Supabase loyihalarda publication odatda mavjud bo'ladi.
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'supabase_realtime publication topilmadi; Dashboard → Database → Replication dan yarating.';
  else
    foreach v_table in array array['checkins', 'reminders', 'notifications'] loop
      if not exists (
        select 1
        from pg_publication_rel pr
        join pg_publication p on p.oid = pr.prpubid
        join pg_class c on c.oid = pr.prrelid
        join pg_namespace n on n.oid = c.relnamespace
        where p.pubname = 'supabase_realtime'
          and n.nspname = 'public'
          and c.relname = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end;
$$;
