# CareLink — Bemor (Mijoz) Flutter Ilovasi

Statsionardan chiqqan bemorning kuzatuvda yo'qolib qolish muammosini hal qiluvchi
mobil ilova. Bemor (mijoz) CareLink'ga ro'yxatdan o'tadi, **Premium obuna** ($5/oy)
sotib oladi va AI yordamchi har soatda uni tekshirib turadi.

## Oqim (flow)

```
Ro'yxatdan o'tish → Sog'liq ma'lumotlari → Premium obuna ($5/oy)
   → Har soatda AI tekshiruvi (push notification)
       → Javob bersa: Yaxshiman / Yomonman
       → Javob bermasa (1 soat): SMS yuboriladi (demo)
       → Hali ham javob bermasa: TELEFON QULFLANADI
           → Ekranda: 102, 103, Yopish, Yaxshiman, Yomonman
```

## Tuzilish

```
lib/
  main.dart                 # Ilova boshlanishi (Supabase init)
  config.dart               # Supabase/OpenAI kalitlari
  models.dart               # Ma'lumot modellari
  state/app_state.dart      # Holat boshqaruvi (Provider)
  services/
    supabase_service.dart   # Supabase (auth, obuna, sog'liq, tekshiruv)
    openai_service.dart     # OpenAI chatbot
  screens/
    splash_screen.dart
    auth/login_screen.dart
    auth/register_screen.dart
    onboarding/health_setup_screen.dart
    subscription_screen.dart
    home_screen.dart
    chat_screen.dart
    lock_screen.dart        # Bloklash ekrani (102/103/Yopish/Yaxshiman/Yomonman)
```

## Sozlash (3 qadam)

### 1. Backend (Supabase)

`supabase/migrations/00007_patient_app.sql` ni SQL editor'da ishga tushiring:
- `client` roli
- `subscriptions` jadvali (Premium $5/oy)
- `client_health` jadvali (sog'liq ma'lumotlari)
- `checkins` jadvali (soatlik tekshiruvlar)

### 2. Soatlik AI tekshiruvi (Edge Function)

```bash
supabase functions deploy hourly-check
```

Env o'zgaruvchilari:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FCM_SERVER_KEY` (push uchun)

Har soatda chaqirish uchun `pg_cron` yoki tashqi cron:
```sql
select cron.schedule('hourly-check', '0 * * * *',
  'select net.http_post(url:=''https://YOUR.supabase.co/functions/v1/hourly-check'', headers:=''{"Authorization":"Bearer SERVICE_ROLE"}''::jsonb)');
```

### 3. Flutter ilovasini sozlash

`lib/config.dart` ga kalitlarni yozing, keyin:

```bash
cd flutter_app

# Platforma papkalarini yaratish (android/, ios/, web/)
# (birinchi marta faqat bir marta kerak)
flutter create . --platforms=android,ios,web --org uz.carelink --project-name carelink_patient

flutter pub get
flutter run
```

> `flutter create .` mavjud `lib/` va `pubspec.yaml` fayllarini saqlab qoladi,
> faqat yetishmayotgan platforma papkalarini (AndroidManifest, iOS Info.plist va h.k.)
> yaratadi.

## Muhim eslatmalar

- **To'lov demo** — haqiqiy to'lov (Payme/Click/Stripe) ulanmagan, "Premium olish"
  tugmasi obunani bevosita faollashtiradi.
- **SMS demo** — haqiqiy provider (Twilio/Eskiz.uz) keyinroq ulanadi, hozir log'ga yoziladi.
- **OpenAI** — kalit kiritilmasa chatbot offline demo javoblar qaytaradi.
- **Telefonni bloklash** — MVP'da ilova ichidagi to'liq ekran bloklash; real qurilma
  darajasida bloklash uchun Device Admin / kiosk rejimi integratsiyasi kerak.
- **Push** — FCM yoki OneSignal orqali; tokenlarni saqlash jadvali keyingi bosqichda.
