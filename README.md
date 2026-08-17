# CareLink

> **Statsionardan uyga — uzluksiz care.**

CareLink — og‘ir yoki davomiy kuzatuv talab qiladigan bemor statsionardan chiqarilgandan keyin ham klinika, tibbiyot xodimi, yaqinlari va AI yordamchini bitta xavfsiz oqimga bog‘laydigan care-coordination platforma.

Klinikada kiritilgan tashxis, discharge xulosasi, tavsiyalar, dori jadvali va hayotiy ko‘rsatkichlar bemorning mobile profiliga sinxronlanadi. Bemor esa reminders, AI check-in, SOS va yaqinlariga xabar berish funksiyalariga ega bo‘ladi.

---

## Platforma modullari

### Web boshqaruv paneli

| Modul | Vazifasi |
| --- | --- |
| **Bosh sahifa** | Bemor, discharge, kuzatuv, klinika va risk statistikasi. |
| **Bemorlar** | Klinikaga biriktirilgan bemorlar, vital ma’lumotlar, timeline va bemor kartasi. |
| **Shifokorlar** | Shifokor profili, ixtisosligi, faolligi va klinikaga biriktirish. |
| **Klinikalar** | Klinika obunasi, account, xizmat radiusi, xarita va holat. |
| **Klinikalar xaritasi** | O‘zbekiston ichidagi klinikalar, radius va bemorlar qamrovi. |
| **Qabul / navbatlar** | Shifokor, xona, vaqt slotlari va queue code boshqaruvi. |
| **Xonalar** | Xona sig‘imi, qavat va bandlik holati. |
| **SOS markazi** | Critical SOS alertlar, queue code, joylashuv va klinika xabarnomalari. |
| **Chiqish** | Statsionardan chiqarish, klinik kod, tavsiya, dori va vital ko‘rsatkichlar. |
| **Kuzatuvlar** | Follow-up, AI check-in, chat va natijalarni yakunlash. |

### Flutter bemor ilovasi

- aktiv obunaga qarab avtomatik Login / Subscription / Home routing;
- individual va klinik kod orqali obuna;
- AI chat — server-side Supabase Edge Function orqali, OpenAI key APK ichida saqlanmaydi;
- dori jadvali va local reminders;
- FCM push, push history va test push;
- beta AI monitoring intervali: 1 / 5 / 10 / 15 / 30 / 60 minut;
- doimiy Android safety notification: **SOS**, **103**, **Yaqinlarga**;
- GPS location bilan SOS queue code va cancel oynasi;
- klinik discharge xulosasi hamda vitallar asosida AI context.

---

## Rollar va ruxsatlar

| Rol | Imkoniyat |
| --- | --- |
| `super_admin` | Klinikalar, obuna, shifokorlar, xonalar, SOS, navbatlar va umumiy nazorat. |
| `medical_worker` | Faqat o‘z klinikasidagi bemor, appointment, discharge va follow-up ma’lumotlari. |
| `patient` | Mobile profil, obuna, dori, reminders, AI check-in, SOS va yaqinlar bilan aloqa. |

Row Level Security klinika doirasini backend tomonda ham tekshiradi. UI cheklovi yagona himoya emas.

---

## Care journey

```text
Bemor klinikaga biriktiriladi
  → Vital ko‘rsatkichlar / tashxis saqlanadi
  → Statsionardan chiqarish
  → Tashxis + xulosa + tavsiya + dorilar + vitals sync
  → Klinik kod / individual obuna
  → Mobile reminders + AI check-in
  → 25 minut javob bo‘lmasa eskalatsiya
  → SOS / 103 / yaqinlarga joylashuv bilan yordam
  → Klinik follow-up va natija
```

---

## Obuna modeli

| Tur | Narx | Holat |
| --- | --- | --- |
| **Individual** | `$5 / 30 kun` | Mobile AI, reminders va monitoring. |
| **Klinik kod** | Bemor uchun bepul | Klinika obunasi `active` yoki `trial` bo‘lsa ishlaydi. |
| **Klinika demo obunasi** | `$29 / 30 kun` | Super admin `/pay` demo checkout orqali faollashtiradi. |

Faol subscription bo‘lsa bemor plan yoki klinik kodni UI/API orqali o‘zgartira olmaydi. Bu qoida RLS va RPC darajasida ham tekshiriladi.

---

## Tezkor ishga tushirish — Web

### 1. Muhit fayli

```bash
cp .env.example .env.local
```

`.env.local` ichida:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

> `SUPABASE_SERVICE_ROLE_KEY` faqat server uchun. Uni browser, Flutter app yoki Git repositoryga yozmang.

### 2. Dependencies va dev server

```bash
npm install
npm run dev
```

Web panel odatda:

```text
http://localhost:3000
```

### 3. Tekshiruv

```bash
npm run lint
npm run build
```

---

## Supabase migratsiyalar

Migratsiyalarni **quyidagi tartibda** Supabase SQL Editor yoki CLI orqali ishga tushiring:

```text
00001_init.sql
00004_full_hierarchy.sql
00005_signup_profile_fields.sql
00005_specialties_routing.sql
00006_seed_regions_districts.sql
00007_patient_app.sql
00008_reminders.sql
00009_subscription_types.sql
00010_chat_family.sql
00011_fix_clinic_code.sql
00012_fcm_token.sql
00013_fix_plan_check.sql
00014_clinic_based.sql
00015_meds_clinic.sql
00016_clinic_first_care_model.sql
00017_healthcare_ops.sql
00017_fix_patient_insert_rls.sql
00018_lock_active_subscriptions.sql
00019_notification_history.sql
00020_vitals_push_beta_settings.sql
00021_enable_mobile_realtime.sql
00022_sos_emergency.sql
00023_sos_queue_and_cancel.sql
00024_fix_reminder_crud_rls.sql
```

### Muhim migratsiyalar

| Fayl | Nima uchun kerak |
| --- | --- |
| `00017_healthcare_ops.sql` | Shifokor, xonalar, schedule, appointment, queue va SOS web modullari. |
| `00018_lock_active_subscriptions.sql` | Faol obunani backend tomonda o‘zgartirishni bloklaydi. |
| `00019_notification_history.sql` | Mobile/web notification tarixi. |
| `00020_vitals_push_beta_settings.sql` | Vital sync, AI context va beta monitoring intervali. |
| `00021_enable_mobile_realtime.sql` | `checkins`, `reminders`, `notifications` realtime. |
| `00022_sos_emergency.sql` | SOS alerts va family location maydonlari. |
| `00023_sos_queue_and_cancel.sql` | Queue code hamda SOS cancel status. |
| `00024_fix_reminder_crud_rls.sql` | Bemor reminder edit/delete/toggle RLS tuzatishi. |

---

## Edge Functions

### Deploy

```bash
supabase functions deploy hourly_check
supabase functions deploy sos-alert
supabase functions deploy ai-chat
```

### `hourly_check`

- individual beta intervalga qarab AI check-in yuboradi;
- FCM push history yaratadi;
- 25 minut javob bo‘lmasa family priority bo‘yicha SMS eskalatsiya qiladi;
- test push action’ini qo‘llaydi.

Batafsil: [`supabase/functions/hourly_check/ENV_SETUP.md`](supabase/functions/hourly_check/ENV_SETUP.md)

### `sos-alert`

- GPS location bilan SOS/family SMS;
- `sos_alerts` yozuvi;
- klinika va super admin notificationlari;
- SMS webhook provider integratsiyasi.

Batafsil: [`supabase/functions/sos-alert/ENV_SETUP.md`](supabase/functions/sos-alert/ENV_SETUP.md)

### `ai-chat`

- Flutter AI chat uchun xavfsiz OpenAI proxy;
- OpenAI key faqat Edge Function secret;
- bemorning discharge, vitals va allergies contextini AI’ga uzatadi.

Batafsil: [`supabase/functions/ai-chat/ENV_SETUP.md`](supabase/functions/ai-chat/ENV_SETUP.md)

---

## Flutter Android ilovasi

Batafsil: [`flutter_app/README.md`](flutter_app/README.md)

### Birinchi Android scaffold

```bash
cd flutter_app
flutter create . --org com.modder --project-name carelink --platforms=android
```

### Android build

```powershell
cd flutter_app
powershell -ExecutionPolicy Bypass -File .\tool\fix_android_gradle.ps1
flutter clean
flutter pub get
flutter build apk --release
```

`fix_android_gradle.ps1` quyidagilarni sozlaydi:

- AndroidX / Jetifier;
- core library desugaring;
- Gradle memory va daemon crash parametrlarini;
- FCM, notification va SOS location manifest permissions.

### Android push test

```text
Profil → Beta AI sozlamalari → FCM INIT: TAYYOR → Test push yuborish
```

Test Android physical qurilmada amalga oshirilishi kerak. Web preview uchun Firebase Web/VAPID config alohida talab qilinadi.

---

## SOS va SMS

- **SOS** — queue code yaratadi, klinika va web panelga alert yuboradi.
- **103** — telefon dialer orqali tez yordam raqamini ochadi.
- **Yaqinlarga** — GPS location link bilan eng ustuvor yaqin odamga xabar yuboradi.
- **Avtomatik 25 minut eskalatsiya** — bemor check-in xabariga javob bermasa ishlaydi.

Actual SMS uchun server-side webhook provider kerak:

```env
SMS_WEBHOOK_URL=https://YOUR_SMS_PROVIDER_ENDPOINT
SMS_WEBHOOK_TOKEN=YOUR_SMS_PROVIDER_TOKEN
```

SMS provider ulanmaganida SOS va web notification ishlaydi, SMS xatosi esa notification tarixida ko‘rsatiladi.

> **MCHJ/YATT talabi:** O‘zbekiston raqamlariga avtomatik transactional SMS yuborish uchun odatda MCHJ yoki YATT nomidan SMS provider (masalan Eskiz, Play Mobile, Twilio yoki korporativ gateway) bilan shartnoma hamda sender ID talab qilinadi. `SMS_WEBHOOK_URL` ushbu shlyuz endpointiga ulanadi; private API token faqat Supabase Edge Function Secrets’da saqlanadi.

---

## API endpointlar

| Endpoint | Tavsif |
| --- | --- |
| `POST /api/admin/clinics` | Klinikani yaratish va login hisobini tayyorlash. |
| `PATCH /api/admin/clinics` | Klinikani yangilash / subscription holati. |
| `POST /api/admin/doctors` | Shifokor qo‘shish. |
| `POST /api/admin/appointments` | Qabul/navbat yaratish. |
| `POST /api/admin/rooms` | Xona qo‘shish. |
| `POST /api/admin/chat` | Klinik chat xabari. |
| `POST /api/admin/sos` | Authenticated mobile SOS yaratish. |
| `PATCH /api/admin/sos` | Open SOS alertni cancel qilish. |
| `POST /api/pay/demo` | Demo individual yoki klinika checkout. |

---

## Brand assets

```text
assets/branding/carelink-logo-light.svg
assets/branding/carelink-logo-dark.svg
assets/branding/carelink-ai-link-icon-light.png
assets/branding/carelink-ai-link-icon-dark.png
assets/branding/carelink-app-mark.png
```

---

## Security checklist

- OpenAI, Firebase private key, SMS provider token va Supabase service role key — faqat server secrets.
- Flutter APK yoki `NEXT_PUBLIC_*` env’ga secret key yozilmaydi.
- Service account key chat/repositoryga yuborilsa darhol rotate qiling.
- SOS requestda patient/clinic server tomonidan auth profile orqali tekshiriladi.
- RLS policylar klinika va bemor ma’lumotlari isolationini saqlaydi.

---

## Repository branches

| Branch | Maqsad |
| --- | --- |
| `main` | Mirjahon web boshqaruv paneli + CareLink mobile integratsiyasi. |
| `eskiweb` | Merge’dan oldingi main branch backup. |
| `mirjahon` | Mirjahon tomonidan yaratilgan web operations branch. |

---

## License

Hackathon / internal project. Production deploymentdan oldin SMS provider, payment gateway, security audit va medical compliance jarayonlarini yakunlang.
