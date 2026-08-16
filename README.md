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

## Rollar (hududiy ierarxiya)

| Rol | Daraja | Vazifasi |
| --- | --- | --- |
| `super_admin` | Respublika | Viloyatlarga admin biriktirish, yakuniy tasdiqlash, audit |
| `admin` | Viloyat | Tuman adminlarini biriktirish, so'rovlarni tasdiqlash |
| `district_admin` | Tuman | Mahalla/area bo'yicha xodimlarni biriktirish, so'rov yuborish |
| `medical_worker` | Xodim | Bemorni ro'yxatga olish, shikoyat va ko'rsatkichlarni kiritish |
| `hospital_doctor` | Xodim | Statsionar davolash, discharge va yo'naltirish |
| `family_doctor` | Xodim | Follow-up kuzatuvlari va natijalarini qayd qilish |

### Tasdiqlash (approval) oqimi

Xodim qo'shish faqat tasdiqlash orqali:

```
Tuman admini so'rov yuboradi
  → Viloyat admini tasdiqlaydi → TUGADI (qabul qilindi)
  → Viloyat rad etsa → Respublika (super admin)
      → Respublika tasdiqlaydi → qabul qilindi
      → Respublika rad etsa → rad etildi
```

## Manzil ierarxiyasi (Punktlar)

Viloyat → Tuman → Mahalla → Ko'cha → Bino → Raqam (bino nomi ixtiyoriy).
Har darajani qo'shish/o'chirish mumkin. Xodimlar mahalla/area darajasida biriktiriladi.

> Ro'yxatdan o'tgan foydalanuvchi dastlab `medical_worker` rolida bo'ladi.
> Birinchi super adminni SQL orqali tayinlang:
>
> ```sql
> update public.profiles set role = 'super_admin' where id = '<user-uuid>';
> ```

## Interfeys (native SPA)

Dashboard **reloadsiz** ishlaydi — barcha bo'limlar (bemorlar, chiqarish, kuzatuvlar,
xabarnomalar, boshqaruv) client-side view sifatida almashinadi, xuddi native
dastur kabi.

- **Duotone standart ikonkalar** — deep ko'k primary, oq fon, yumaloq burchakli
  (UFlow uslubida, tashqi bog'liqliksiz `src/components/icons.tsx`).
- **Logotip** — deep ko'k gradient, oq fonda tibbiy xoch + care halqasi.
- **Qidiruv va filtr** — barcha ro'yxatlarda (bemor, chiqarish, kuzatuv,
  xabarnoma, foydalanuvchilar).
- **Required / optional** belgilar — barcha formalarda.
- **Grafiklar** — bar, area va donut (SVG, bog'liqliksiz).
- **O'zbekiston xaritasi (Leaflet)** — hududni tanlash, har hududda bemorlar soni.
- **To'liq responsiv** — mobil qurilmalar uchun moslashadi.

## Real rejim (Supabase)

Loyiha to'liq **real Supabase** bilan ishlaydi — demo/mock ma'lumotlar yo'q.

1. [supabase.com](https://supabase.com) da loyiha yarating.
2. SQL editor'da `supabase/migrations/00001_init.sql` ni ishga tushiring.
3. `supabase/seed.sql` orqali 14 ta hudud va muassasalarni qo'shing.
4. `.env.local` ga URL va anon key yozing, serverni qayta yuklang.
5. Ro'yxatdan o'tgandan so'ng birinchi super adminni tayinlang:
   ```sql
   update public.profiles set role = 'super_admin' where id = '<user-uuid>';
   ```

## Xarita (Leaflet + OpenStreetMap)

Hududlar xaritasi **Leaflet + OpenStreetMap** bilan ishlaydi — hech qanday API
kalit talab qilmaydi. Har hududda bemorlar soni markerda ko'rinadi, hududni
bosish bemorlar ro'yxatini filtrlaydi. Koordinatalar `src/lib/geo.ts` da
(14 ta hudud, soddalashtirilgan poligonlar).

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
