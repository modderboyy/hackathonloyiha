-- =====================================================================
-- CareLink — Seed ma'lumotlar (hududlar va muassasalar)
-- Ishga tushirish: supabase db push && supabase db seed yoki
-- SQL editorda ishga tushirish.
-- =====================================================================

-- Hududlar
insert into public.regions (name, code) values
  ('Toshkent shahri', 'TASH'),
  ('Toshkent viloyati', 'TASHVIL'),
  ('Samarqand viloyati', 'SAM'),
  ('Farg''ona viloyati', 'FAR'),
  ('Andijon viloyati', 'AND'),
  ('Namangan viloyati', 'NAM'),
  ('Buxoro viloyati', 'BUX'),
  ('Qashqadaryo viloyati', 'QASH'),
  ('Xorazm viloyati', 'XOR'),
  ('Navoiy viloyati', 'NAV')
on conflict (code) do nothing;

-- Muassasalar
insert into public.facilities (name, type, region_id) values
  ('Markaziy shahar shifoxonasi', 'hospital', (select id from regions where code = 'TASH')),
  ('1-son shahar poliklinikasi', 'polyclinic', (select id from regions where code = 'TASH')),
  ('Qishloq oilaviy poliklinikasi', 'family_clinic', (select id from regions where code = 'TASHVIL')),
  ('Samarqand viloyat shifoxonasi', 'hospital', (select id from regions where code = 'SAM')),
  ('Buxoro tuman poliklinikasi', 'polyclinic', (select id from regions where code = 'BUX'))
on conflict do nothing;
