# CareLink — uzluksiz tibbiy kuzatuv platformasi

CareLink statsionardan (OVaBMU) chiqarilgan og‘ir bemorni uyga qaytgach ham kuzatuvsiz qoldirmaydi. Klinika discharge rejasini bir marta yaratadi; bemor mobil ilovasida dori jadvali, reminders, AI care konteksti va check-in paydo bo‘ladi.

## Yangi care modeli

### Rollar

| Rol | Vazifa |
| --- | --- |
| `super_admin` | Klinikalar, ularning obunasi, xavfsiz loginlari va O‘zbekiston xaritasini boshqaradi. |
| `medical_worker` | Faqat o‘z klinikasidagi bemorlarni ko‘radi, chiqarish va kuzatuvlarni yuritadi. |
| `patient` | Flutter ilovasi orqali individual yoki klinik obunaga ulanadi. |

### Asosiy ish maydoni

Web panelda faqat amaliy oqim qoldirilgan:

- **Bosh sahifa** — jami/sog‘/kasal bemorlar, chiqarish natijalari, kuzatuv holati, klinikalar xaritasi.
- **Bemorlar** — faqat shu klinikaga tegishli saqlangan bemorlar; bemor profilidan bevosita chiqarish mumkin.
- **Chiqarish** — tashxis, davolash yakuni, tavsiyalar, klinik kod va dori jadvali.
- **Kuzatuvlar** — mobile check-in hamda AI suhbat signalini ko‘rib, natijani qayd etish.
- **Klinikalar** — faqat super admin uchun; obuna va joylashuv/radius xaritasi.

## Subscription modeli

1. **Individual** — bemor uchun **$5 / oy**.
2. **Klinik kod** — klinika bergan kod bilan bepul. Kod faqat klinika obunasi `active`/`trial` bo‘lsa faollashadi.

> Klinika login paroli hech qachon jadvalga ochiq matnda yozilmaydi. `POST /api/admin/clinics` server-only `SUPABASE_SERVICE_ROLE_KEY` yordamida Supabase Auth hisobini yaratadi yoki yangilaydi.

## Dori → mobile reminder sync

Dori yozuvida kuniga necha mahal, aniq vaqtlar, har necha soatda va necha kun qabul qilinishi saqlanadi. `00016_clinic_first_care_model.sql` avtomatik ravishda bemor reminders’ini yaratadi. Flutter ilovasi realtime orqali ularni telefonning local notifications tizimiga rejalashtiradi.

## Ishga tushirish

```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY va
# klinika account provisioning uchun SUPABASE_SERVICE_ROLE_KEY ni kiriting
npm install
npm run dev
```

Keyin Supabase SQL editor’da migratsiyalarni ketma-ket ishga tushiring, shu jumladan:

```text
supabase/migrations/00016_clinic_first_care_model.sql
```

## Flutter

Batafsil mobil sozlash: [`flutter_app/README.md`](flutter_app/README.md)

```bash
cd flutter_app
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

## Tekshiruv

```bash
npm run lint
npm run build
```
