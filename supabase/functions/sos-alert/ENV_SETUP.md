# CareLink SOS va SMS sozlamasi

`sos-alert` Edge Function SOS alertni `public.sos_alerts` ga saqlaydi, klinika web notificationlarini yaratadi va eng yaqin (yoki `priority=1`) oila a'zosiga SMS yuboradi.

## Deploy

```bash
supabase functions deploy sos-alert
```

`SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` Supabase Default Secrets sifatida mavjud bo‘ladi.

## SMS provider

Avtomatik SMS device’dan emas, server SMS provider orqali yuboriladi. Bu Android `SEND_SMS`/Play Store cheklovlaridan xavfsizroq va bemor ilovasi yopiq bo‘lsa ham ishlaydi.

Generic webhook sozlamasi:

```bash
supabase secrets set \
  SMS_WEBHOOK_URL=https://YOUR_SMS_PROVIDER_ENDPOINT \
  SMS_WEBHOOK_TOKEN=YOUR_SMS_PROVIDER_TOKEN
```

Function provider webhook’ga shunday JSON yuboradi:

```json
{
  "phone": "+998901234567",
  "message": "CareLink SOS: ... https://maps.google.com/?q=..."
}
```

`SMS_WEBHOOK_URL` bo‘lmasa SOS alert va klinika notification saqlanadi, lekin SMS yuborilmaydi; app foydalanuvchiga aniq sababni ko‘rsatadi.

## 25 minut eskalatsiya

`hourly_check` Edge Function har minutda cron orqali ishlashi kerak. Bemor AI check-in xabariga 25 minut ichida javob bermasa, `family_members.priority` bo‘yicha birinchi faol odamga SMS yuboriladi.
