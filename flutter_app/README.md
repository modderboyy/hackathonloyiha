# CareLink — bemor Flutter ilovasi

CareLink statsionardan chiqarilgan og‘ir bemorning care jarayonini klinikadan uyga uzmaydi.
Webdagi chiqarish rejasidan **tashxis, davolash yakuni, tavsiyalar, dorilar va reminder jadvali** bemor ilovasiga avtomatik keladi.

## Bemor oqimi

```text
Ro‘yxatdan o‘tish / klinik kod
  → individual $5 obuna yoki faol klinika orqali bepul obuna
  → discharge care rejasini sinxronlash
  → telefon reminderlari + AI check-in
  → tibbiyot xodimi kuzatuv natijasi
```

### Ikki obuna turi

- **Individual** — $5 / oy. Klinikaga bog‘lanmasdan AI yordamchi, health dashboard va reminders. Mobil ilovadagi **Demo karta bilan to‘lash** ekrani hozircha haqiqiy pul yechmaydi, faqat 30 kunlik obunani sinov uchun faollashtiradi.
- **Klinik kod** — bemor statsionardan chiqarilganda berilgan kod bilan aktivlashadi. Klinika obunasi `active` yoki `trial` bo‘lsa bepul ishlaydi. Klinikani faollashtirish Super adminning webdagi `/pay` demo checkouti orqali amalga oshadi.

`00018_lock_active_subscriptions.sql` dan keyin `public.subscriptions` ichida faol row bo‘lsa SubscriptionScreen umuman chiqmaydi. Bemor mobile UI yoki API orqali plan/kodini o‘zgartira olmaydi; backend buni RPC va RLS bilan ham bloklaydi.

## Auto-reminders qanday ishlaydi

Webdagi chiqarish formasida xodim har bir dori uchun quyidagilarni kiritadi:

- doza;
- har kuni necha mahal va aniq vaqtlar **yoki** har necha soatda;
- necha kun qabul qilinishi.

`00016_clinic_first_care_model.sql` migratsiyasi medication → reminder yozuvlarini avtomatik yaratadi. Ilova:

1. Supabase realtime orqali yangilangan reminders’ni oladi;
2. ularni Android/iOS local notifications’iga rejalashtiradi;
3. kurs tugash sanasidan keyin bildirishnoma yubormaydi.

Klinikadan sinxronlangan reminders mobil ekranda alohida belgi bilan ko‘rsatiladi va bemor tomonidan o‘chirib yuborilmaydi.

## Sozlash

### 1. Supabase migratsiyalarini ishga tushiring

Bazaviy migratsiyalardan keyin ayniqsa quyidagini ham ishlating:

```text
supabase/migrations/00016_clinic_first_care_model.sql
supabase/migrations/00017_fix_patient_insert_rls.sql
supabase/migrations/00018_lock_active_subscriptions.sql
supabase/migrations/00019_notification_history.sql
supabase/migrations/00020_vitals_push_beta_settings.sql
supabase/migrations/00021_enable_mobile_realtime.sql
```

Bu migratsiya uchta rol (`super_admin`, `medical_worker`, `patient`), klinika doirasi RLS, dori-reminder sync va AI care kontekstini yaratadi.

### 2. Ilovani sozlang

Standart Supabase public URL/anon key ilovaga qo‘shilgan, shu sababli mavjud CareLink loyihasi bilan oddiy `flutter run` ham ishlaydi. Boshqa loyiha uchun yoki build konfiguratsiyasini almashtirishda quyidagi qiymatlarni build vaqtida uzating:

```bash
cd flutter_app
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY \
  --dart-define=OPENAI_API_KEY=YOUR_OPENAI_KEY
```

`OPENAI_API_KEY` berilmasa chat xavfsiz offline demo javobini qaytaradi.

### 3. Push / soatlik check-in (ixtiyoriy)

```bash
supabase functions deploy hourly_check
```

Edge Function uchun `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` va FCM sozlamalarini Supabase secret sifatida kiriting.

## Muhim xavfsizlik eslatmasi

- Parollar faqat Supabase Auth’da xeshlangan holatda saqlanadi.
- Klinik discharge ma’lumoti bemor bilan bog‘lanmaguncha klinika doirasida qoladi.
- AI yordamchi tashxis qo‘ymaydi; xavf belgisi bo‘lsa 103 ga murojaat qilishni tavsiya qiladi.
