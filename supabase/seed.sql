-- =====================================================================
-- CareLink — Seed ma'lumotlar (hududlar va muassasalar)
-- Ishga tushirish: SQL editorda ishga tushiring yoki `supabase db seed`
-- =====================================================================

-- Hududlar (kodlar xaritadagi geo.ts bilan mos)
insert into public.regions (name, code) values
  ('Qoraqalpog''iston Respublikasi', 'QR'),
  ('Xorazm viloyati', 'XO'),
  ('Buxoro viloyati', 'BU'),
  ('Navoiy viloyati', 'NV'),
  ('Samarqand viloyati', 'SA'),
  ('Jizzax viloyati', 'JI'),
  ('Sirdaryo viloyati', 'SI'),
  ('Toshkent viloyati', 'TV'),
  ('Toshkent shahri', 'TS'),
  ('Namangan viloyati', 'NM'),
  ('Andijon viloyati', 'AN'),
  ('Farg''ona viloyati', 'FA'),
  ('Qashqadaryo viloyati', 'QK'),
  ('Surxondaryo viloyati', 'SU')
on conflict (code) do nothing;

-- Muassasalar
insert into public.facilities (name, type, region_id) values
  ('Markaziy shahar shifoxonasi', 'hospital', (select id from regions where code = 'TS')),
  ('1-son shahar poliklinikasi', 'polyclinic', (select id from regions where code = 'TS')),
  ('Qishloq oilaviy poliklinikasi', 'family_clinic', (select id from regions where code = 'TV')),
  ('Samarqand viloyat shifoxonasi', 'hospital', (select id from regions where code = 'SA')),
  ('Buxoro tuman poliklinikasi', 'polyclinic', (select id from regions where code = 'BU'))
on conflict do nothing;

-- Tumanlar (namuna)
insert into public.districts (name, region_id) values
  ('Yunusobod tumani', (select id from regions where code = 'TS')),
  ('Chilonzor tumani', (select id from regions where code = 'TS')),
  ('Qibray tumani', (select id from regions where code = 'TV')),
  ('Parkent tumani', (select id from regions where code = 'TV')),
  ('Samarqand tumani', (select id from regions where code = 'SA'))
on conflict do nothing;
