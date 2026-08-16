# CareLink — Raqamli tibbiy kuzatuv platformasi

Bemorning smartfoni yoki interneti bo'lmasa ham, uning tibbiy ma'lumotlari
yo'qolib qolmasligi va statsionardan chiqarilgach keyingi kuzatuvi uzilmasligini
ta'minlaydigan **care-coordination** platformasi.

> **We don't just digitize medical records. We make sure the patient doesn't
> get lost between healthcare stages.**

## Texnologiyalar

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Supabase** (Auth, PostgreSQL, RLS, triggerlar)
- **Tailwind CSS 4**

## Ishga tushirish

### 1. Supabase'ni sozlash

1. [supabase.com](https://supabase.com) da yangi loyiha yarating.
2. SQL editor'da `supabase/migrations/00001_init.sql` faylini ishga tushiring
   (jadvallar, RLS va triggerlar yaratiladi).
3. Ixtiyoriy: `supabase/seed.sql` orqali hudud va muassasalarni qo'shing.

### 2. Muhit o'zgaruvchilari

```bash
cp .env.example .env.local
```

`.env.local` faylini Supabase Project Settings > API sahifasidagi
URL va anon key bilan to'ldiring.

### 3. Ishga tushirish

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) da oching.

## Rollar

| Rol | Tavsif |
| --- | --- |
| `admin` | Hududlar, muassasalar, rollar va audit |
| `medical_worker` | Bemorni ro'yxatga olish, shikoyat va ko'rsatkichlarni kiritish |
| `hospital_doctor` | Statsionar davolash, discharge va yo'naltirish |
| `family_doctor` | Follow-up kuzatuvlari va natijalarini qayd qilish |

> Ro'yxatdan o'tgan foydalanuvchi dastlab `medical_worker` rolida bo'ladi.
> Birinchi adminni SQL orqali tayinlang:
>
> ```sql
> update public.profiles set role = 'admin' where id = '<user-uuid>';
> ```

## Asosiy oqim (bemor care journey)

```
Bemor → Poliklinika (xodim raqamlashtiradi) → CareLink
      → Statsionar → Discharge → Avtomatik xabarnoma
      → Hududiy oilaviy shifokor → Follow-up → Natija qayd qilinadi
```

Discharge yaratilganda PostgreSQL triggeri avtomatik ravishda:
1. Bemorning hududi bo'yicha oilaviy shifokorni topadi;
2. `follow_ups` yozuvini yaratadi;
3. Shifokorga `notifications` xabarnomasini yuboradi.

## Loyiha tuzilishi

```
supabase/
  migrations/00001_init.sql   # Sxema, RLS, triggerlar
  seed.sql                    # Hududlar va muassasalar
src/
  app/                        # Sahifalar (App Router)
  lib/
    supabase/                 # Supabase klientlari
    actions/                  # Server actionlar
    types.ts                  # Tiplar
    utils.ts                  # Yordamchi funksiyalar
  middleware.ts               # Auth himoyasi
```

## MVP funksiyalar

- [x] Role-based login (Supabase Auth + RLS)
- [x] Bemor profilini yaratish/topish
- [x] Klinik tashvisni qayd qilish (intake)
- [x] Vital ko'rsatkichlarni kiritish
- [x] Statsionar discharge formasi
- [x] Hudud bo'yicha oilaviy shifokorni avtomatik bog'lash
- [x] Avtomatik notification (trigger)
- [x] Follow-up task + yakunlash
- [x] Bemorning tibbiy timeline'i
- [x] Audit log
