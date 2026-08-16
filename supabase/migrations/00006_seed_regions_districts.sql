-- =====================================================================
-- CareLink — Migration 00006: O'zbekiston viloyatlari, tumanlari va mahallalari
-- Pryamoy ko'rsatish uchun tayyor seed: foydalanuvchi ro'yxatdan o'tishda
-- viloyat -> tuman -> mahalla zanjiri ishlashi uchun yetarli ma'lumotlar kiritiladi.
-- =====================================================================

-- 1) Viloyatlar
insert into public.regions (name, code)
values
  ('Qoraqalpog''iston Respublikasi', 'QR'),
  ('Andijon viloyati', 'AN'),
  ('Buxoro viloyati', 'BU'),
  ('Farg''ona viloyati', 'FA'),
  ('Jizzax viloyati', 'JI'),
  ('Xorazm viloyati', 'XO'),
  ('Namangan viloyati', 'NM'),
  ('Navoiy viloyati', 'NV'),
  ('Qashqadaryo viloyati', 'QK'),
  ('Samarqand viloyati', 'SA'),
  ('Surxondaryo viloyati', 'SU'),
  ('Sirdaryo viloyati', 'SI'),
  ('Toshkent viloyati', 'TV'),
  ('Toshkent shahri', 'TS')
on conflict (code) do nothing;

-- 2) Tumanlar
-- Qoraqalpog'iston Respublikasi
insert into public.districts (name, region_id)
select 'Beruniy tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Beruniy tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Bo''zatov tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Bo''zatov tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Chimboy tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Chimboy tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Ellikqal''a tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Ellikqal''a tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Kegeyli tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Kegeyli tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Mo''ynoq tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Mo''ynoq tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Nukus tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Nukus tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Qanliko''l tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Qanliko''l tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Qorao''zak tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Qorao''zak tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Qo''ng''irot tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Qo''ng''irot tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Shumanay tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Shumanay tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Taxtako''pir tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Taxtako''pir tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'To''rtko''l tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'To''rtko''l tumani' and d.region_id = (select id from public.regions where code = 'QR'));

insert into public.districts (name, region_id)
select 'Amudaryo tumani', id from public.regions where code = 'QR'
where not exists (select 1 from public.districts d where d.name = 'Amudaryo tumani' and d.region_id = (select id from public.regions where code = 'QR'));

-- Andijon viloyati
insert into public.districts (name, region_id)
select 'Andijon tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Andijon tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Asaka tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Asaka tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Baliqchi tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Baliqchi tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Bo''z tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Bo''z tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Buloqboshi tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Buloqboshi tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Izboskan tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Izboskan tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Jalaquduq tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Jalaquduq tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Xo''jaobod tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Xo''jaobod tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Marhamat tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Marhamat tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Oltinko''l tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Oltinko''l tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Paxtaobod tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Paxtaobod tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Shahrixon tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Shahrixon tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Ulug''nor tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Ulug''nor tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Xonobod tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Xonobod tumani' and d.region_id = (select id from public.regions where code = 'AN'));

insert into public.districts (name, region_id)
select 'Qo''rg''ontepa tumani', id from public.regions where code = 'AN'
where not exists (select 1 from public.districts d where d.name = 'Qo''rg''ontepa tumani' and d.region_id = (select id from public.regions where code = 'AN'));

-- Buxoro viloyati
insert into public.districts (name, region_id)
select 'Buxoro tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Buxoro tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Vobkent tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Vobkent tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'G''ijduvon tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'G''ijduvon tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Jondor tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Jondor tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Kogon tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Kogon tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Kori tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Kori tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Olot tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Olot tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Peshku tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Peshku tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Qorako''l tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Qorako''l tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Qorovulbozor tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Qorovulbozor tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Romitan tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Romitan tumani' and d.region_id = (select id from public.regions where code = 'BU'));

insert into public.districts (name, region_id)
select 'Shofirkon tumani', id from public.regions where code = 'BU'
where not exists (select 1 from public.districts d where d.name = 'Shofirkon tumani' and d.region_id = (select id from public.regions where code = 'BU'));

-- Farg'ona viloyati
insert into public.districts (name, region_id)
select 'Bag''dod tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Bag''dod tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Beshariq tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Beshariq tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Dang''ara tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Dang''ara tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Farg''ona tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Farg''ona tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Furqat tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Furqat tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Qo''shtepa tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Qo''shtepa tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Kokand tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Kokand tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Marg''ilon tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Marg''ilon tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Oltiariq tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Oltiariq tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'O''zbekiston tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'O''zbekiston tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Rishton tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Rishton tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'So''x tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'So''x tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Toshloq tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Toshloq tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Uchko''prik tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Uchko''prik tumani' and d.region_id = (select id from public.regions where code = 'FA'));

insert into public.districts (name, region_id)
select 'Quva tumani', id from public.regions where code = 'FA'
where not exists (select 1 from public.districts d where d.name = 'Quva tumani' and d.region_id = (select id from public.regions where code = 'FA'));

-- Jizzax viloyati
insert into public.districts (name, region_id)
select 'Arnasoy tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Arnasoy tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Baxmal tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Baxmal tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Dustlik tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Dustlik tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Forish tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Forish tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'G''allaorol tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'G''allaorol tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Jizzax tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Jizzax tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Mirzacho''l tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Mirzacho''l tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Paxtakor tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Paxtakor tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Yangiobod tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Yangiobod tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Zafarobod tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Zafarobod tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Zomin tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Zomin tumani' and d.region_id = (select id from public.regions where code = 'JI'));

insert into public.districts (name, region_id)
select 'Sharof Rashidov tumani', id from public.regions where code = 'JI'
where not exists (select 1 from public.districts d where d.name = 'Sharof Rashidov tumani' and d.region_id = (select id from public.regions where code = 'JI'));

-- Xorazm viloyati
insert into public.districts (name, region_id)
select 'Bog''ot tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Bog''ot tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Gurlan tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Gurlan tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Hazorasp tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Hazorasp tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Xiva tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Xiva tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Xonqa tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Xonqa tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Pitnak tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Pitnak tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Qo''shko''pir tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Qo''shko''pir tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Shovot tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Shovot tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Urganch tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Urganch tumani' and d.region_id = (select id from public.regions where code = 'XO'));

insert into public.districts (name, region_id)
select 'Yangiarik tumani', id from public.regions where code = 'XO'
where not exists (select 1 from public.districts d where d.name = 'Yangiarik tumani' and d.region_id = (select id from public.regions where code = 'XO'));

-- Namangan viloyati
insert into public.districts (name, region_id)
select 'Chortoq tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Chortoq tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Chust tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Chust tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Kosonsoy tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Kosonsoy tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Mingbuloq tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Mingbuloq tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Namangan tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Namangan tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Naryn tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Naryn tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Norin tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Norin tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Pop tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Pop tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'To''raqo''rg''on tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'To''raqo''rg''on tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Uchqo''rg''on tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Uchqo''rg''on tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Uychi tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Uychi tumani' and d.region_id = (select id from public.regions where code = 'NM'));

insert into public.districts (name, region_id)
select 'Yangiqo''rg''on tumani', id from public.regions where code = 'NM'
where not exists (select 1 from public.districts d where d.name = 'Yangiqo''rg''on tumani' and d.region_id = (select id from public.regions where code = 'NM'));

-- Navoiy viloyati
insert into public.districts (name, region_id)
select 'Karmana tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Karmana tumani' and d.region_id = (select id from public.regions where code = 'NV'));

insert into public.districts (name, region_id)
select 'Konimex tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Konimex tumani' and d.region_id = (select id from public.regions where code = 'NV'));

insert into public.districts (name, region_id)
select 'Navoiy tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Navoiy tumani' and d.region_id = (select id from public.regions where code = 'NV'));

insert into public.districts (name, region_id)
select 'Nurota tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Nurota tumani' and d.region_id = (select id from public.regions where code = 'NV'));

insert into public.districts (name, region_id)
select 'Qiziltepa tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Qiziltepa tumani' and d.region_id = (select id from public.regions where code = 'NV'));

insert into public.districts (name, region_id)
select 'Tomdi tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Tomdi tumani' and d.region_id = (select id from public.regions where code = 'NV'));

insert into public.districts (name, region_id)
select 'Uchquduq tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Uchquduq tumani' and d.region_id = (select id from public.regions where code = 'NV'));

insert into public.districts (name, region_id)
select 'Xatirchi tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Xatirchi tumani' and d.region_id = (select id from public.regions where code = 'NV'));

insert into public.districts (name, region_id)
select 'Zarafshon tumani', id from public.regions where code = 'NV'
where not exists (select 1 from public.districts d where d.name = 'Zarafshon tumani' and d.region_id = (select id from public.regions where code = 'NV'));

-- Qashqadaryo viloyati
insert into public.districts (name, region_id)
select 'Chiroqchi tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Chiroqchi tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Dehqonobod tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Dehqonobod tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'G''uzor tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'G''uzor tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Kasbi tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Kasbi tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Kitob tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Kitob tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Koson tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Koson tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Kumkurgon tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Kumkurgon tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Muborak tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Muborak tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Nishon tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Nishon tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Qamashi tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Qamashi tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Qarshi tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Qarshi tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Shahrisabz tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Shahrisabz tumani' and d.region_id = (select id from public.regions where code = 'QK'));

insert into public.districts (name, region_id)
select 'Yakkabog'' tumani', id from public.regions where code = 'QK'
where not exists (select 1 from public.districts d where d.name = 'Yakkabog'' tumani' and d.region_id = (select id from public.regions where code = 'QK'));

-- Samarqand viloyati
insert into public.districts (name, region_id)
select 'Bulung''ur tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Bulung''ur tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Ishtixon tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Ishtixon tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Jomboy tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Jomboy tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Kattaqorgon tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Kattaqorgon tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Narpay tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Narpay tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Nurabad tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Nurabad tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Oqdaryo tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Oqdaryo tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Paxtachi tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Paxtachi tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Pastdarg''om tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Pastdarg''om tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Payariq tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Payariq tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Samarqand tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Samarqand tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Taylak tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Taylak tumani' and d.region_id = (select id from public.regions where code = 'SA'));

insert into public.districts (name, region_id)
select 'Urgut tumani', id from public.regions where code = 'SA'
where not exists (select 1 from public.districts d where d.name = 'Urgut tumani' and d.region_id = (select id from public.regions where code = 'SA'));

-- Surxondaryo viloyati
insert into public.districts (name, region_id)
select 'Angor tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Angor tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Boysun tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Boysun tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Denov tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Denov tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Jarkurgon tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Jarkurgon tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Kizirik tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Kizirik tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Muzrabot tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Muzrabot tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Oltinsoy tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Oltinsoy tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Sariosiyo tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Sariosiyo tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Sherobod tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Sherobod tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Termiz tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Termiz tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Uzun tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Uzun tumani' and d.region_id = (select id from public.regions where code = 'SU'));

insert into public.districts (name, region_id)
select 'Qiziriq tumani', id from public.regions where code = 'SU'
where not exists (select 1 from public.districts d where d.name = 'Qiziriq tumani' and d.region_id = (select id from public.regions where code = 'SU'));

-- Sirdaryo viloyati
insert into public.districts (name, region_id)
select 'Akaltyn tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Akaltyn tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Baxt tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Baxt tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Guliston tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Guliston tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Hovos tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Hovos tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Mirzaobod tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Mirzaobod tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Oqoltin tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Oqoltin tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Sardoba tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Sardoba tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Sayxun tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Sayxun tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Shirin tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Shirin tumani' and d.region_id = (select id from public.regions where code = 'SI'));

insert into public.districts (name, region_id)
select 'Yangiyer tumani', id from public.regions where code = 'SI'
where not exists (select 1 from public.districts d where d.name = 'Yangiyer tumani' and d.region_id = (select id from public.regions where code = 'SI'));

-- Toshkent viloyati
insert into public.districts (name, region_id)
select 'Bekobod tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Bekobod tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Bo''ka tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Bo''ka tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Bostanliq tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Bostanliq tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Chinoz tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Chinoz tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Qibray tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Qibray tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Oqqo''rg''on tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Oqqo''rg''on tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Parkent tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Parkent tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Pskent tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Pskent tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Quvasoy tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Quvasoy tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Yangiyo''l tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Yangiyo''l tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Yuqori Chirchiq tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Yuqori Chirchiq tumani' and d.region_id = (select id from public.regions where code = 'TV'));

insert into public.districts (name, region_id)
select 'Zangiota tumani', id from public.regions where code = 'TV'
where not exists (select 1 from public.districts d where d.name = 'Zangiota tumani' and d.region_id = (select id from public.regions where code = 'TV'));

-- Toshkent shahri
insert into public.districts (name, region_id)
select 'Chilonzor tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Chilonzor tumani' and d.region_id = (select id from public.regions where code = 'TS'));

insert into public.districts (name, region_id)
select 'Mirobod tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Mirobod tumani' and d.region_id = (select id from public.regions where code = 'TS'));

insert into public.districts (name, region_id)
select 'Olmazor tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Olmazor tumani' and d.region_id = (select id from public.regions where code = 'TS'));

insert into public.districts (name, region_id)
select 'Shayxontohur tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Shayxontohur tumani' and d.region_id = (select id from public.regions where code = 'TS'));

insert into public.districts (name, region_id)
select 'Uchtepa tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Uchtepa tumani' and d.region_id = (select id from public.regions where code = 'TS'));

insert into public.districts (name, region_id)
select 'Yakkasaroy tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Yakkasaroy tumani' and d.region_id = (select id from public.regions where code = 'TS'));

insert into public.districts (name, region_id)
select 'Yashnobod tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Yashnobod tumani' and d.region_id = (select id from public.regions where code = 'TS'));

insert into public.districts (name, region_id)
select 'Yunusobod tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Yunusobod tumani' and d.region_id = (select id from public.regions where code = 'TS'));

insert into public.districts (name, region_id)
select 'Yakkasaroy tumani', id from public.regions where code = 'TS'
where not exists (select 1 from public.districts d where d.name = 'Yakkasaroy tumani' and d.region_id = (select id from public.regions where code = 'TS'));

-- 3) Mahallalar (har bir tuman uchun 1-2 asosiy mahalla)
insert into public.neighborhoods (name, district_id)
select d.name || ' 1-mahalla', d.id
from public.districts d
where not exists (
  select 1 from public.neighborhoods n where n.name = d.name || ' 1-mahalla' and n.district_id = d.id
);

insert into public.neighborhoods (name, district_id)
select d.name || ' 2-mahalla', d.id
from public.districts d
where not exists (
  select 1 from public.neighborhoods n where n.name = d.name || ' 2-mahalla' and n.district_id = d.id
);

insert into public.neighborhoods (name, district_id)
select d.name || ' 3-mahalla', d.id
from public.districts d
where not exists (
  select 1 from public.neighborhoods n where n.name = d.name || ' 3-mahalla' and n.district_id = d.id
);

-- Optional: region/facility seed harmonization
insert into public.facilities (name, type, region_id)
select 'Markaziy shahar shifoxonasi', 'hospital', id from public.regions where code = 'TS'
where not exists (
  select 1 from public.facilities f where f.name = 'Markaziy shahar shifoxonasi' and f.region_id = (select id from public.regions where code = 'TS')
);

insert into public.facilities (name, type, region_id)
select 'Viloyat markaziy shifoxonasi', 'hospital', id from public.regions where code = 'AN'
where not exists (
  select 1 from public.facilities f where f.name = 'Viloyat markaziy shifoxonasi' and f.region_id = (select id from public.regions where code = 'AN')
);
