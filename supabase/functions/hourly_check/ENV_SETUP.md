# Supabase Edge Function — Android push, test push va beta monitoring sozlash

Sizda Firebase **V1 API** enabled (Legacy disabled). V1 API service account orqali ishlaydi.
Firebase secretlari `client_email` va `private_key` bir xil service-account JSON faylidan olinishi shart.

## Kerakli 4 ta env qiymati

| Env nomi | Qiymat | Holat |
|---|---|---|
| `SUPABASE_URL` | `https://flpmqhditzfosvdtbqlw.supabase.co` | ✅ tayyor |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Default Secret | ✅ serverda mavjud |
| `FIREBASE_PROJECT_ID` | service-account JSON `project_id` | ✅ `carelink-ca427` |
| `FIREBASE_CLIENT_EMAIL` | service-account JSON `client_email` | ⚠️ JSON bilan bir xil bo‘lishi shart |
| `FIREBASE_PRIVATE_KEY` | service-account JSON `private_key` (to‘liq PEM) | ⚠️ `private_key_id` emas |
| `SMS_WEBHOOK_URL` | SMS provider endpoint (Eskiz/Twilio/custom) | ⚠️ avtomatik SMS uchun kerak |
| `SMS_WEBHOOK_TOKEN` | SMS provider token | ⚠️ provider talab qilsa |

## 1. Service role key ni olish (sizdan kerak)

1. [supabase.com](https://supabase.com) → loyihangiz (`flpmqhditzfosvdtbqlw`) → **Project Settings → API**
2. **`service_role` key** ni nusxalang (anon key emas, service_role!)
   - U `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscG1xaGRpdHpmb3N2ZHRicWx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIs...` ko'rinishida

## 2. Env'ni qo'shish (2 yo'l)

### Yo'l A — Supabase Dashboard (oson)

1. Supabase Dashboard → **Edge Functions** → `hourly_check` ni tanlang (avval deploy qilgan bo'lsangiz)
2. **Settings → Edge Function Secrets** bo'limi
3. Quyidagilarni qo'shing (birma-bir "Add secret"):

```
SUPABASE_URL = https://flpmqhditzfosvdtbqlw.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci... (service_role key)
FIREBASE_PROJECT_ID = service-account JSON ichidagi project_id
FIREBASE_CLIENT_EMAIL = service-account JSON ichidagi client_email
FIREBASE_PRIVATE_KEY = service-account JSON ichidagi to‘liq private_key

# Muhim: eaf7bd... kabi private_key_id ni FIREBASE_PRIVATE_KEY ga qo‘ymang.
```

### Yo'l B — Supabase CLI (tavsiya, bitta buyruq)

Service-account JSON dan secretlarni xatosiz olish uchun script ishlating:

```powershell
supabase login
powershell -ExecutionPolicy Bypass -File .\supabase\functions\hourly_check\set_firebase_secrets.ps1 -JsonPath "C:\path\carelink-service-account.json"
supabase functions deploy hourly_check
```

Script `project_id`, `client_email` va to‘liq `private_key` ni JSON ichidan o‘qiydi. U private key ID ni secret sifatida yubormaydi.

## 3. Beta monitoring uchun har minutda ishga tushirish (cron)

Bemor Profil → Beta AI sozlamalarida `1, 5, 10, 15, 30 yoki 60 minut` interval tanlaydi. Shuning uchun Edge Function cron orqali **har minutda** chaqiriladi; function faqat intervali yetgan bemorlarga push yuboradi:

```sql
-- Supabase SQL editor'da:
select cron.schedule(
  'carelink-beta-monitoring',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://flpmqhditzfosvdtbqlw.supabase.co/functions/v1/hourly_check',
    headers := '{"Authorization":"Bearer YOUR-SERVICE-ROLE-KEY"}'::jsonb
  )
  $$
);
```

> Agar `cron` yoki `net` extension yo'q bo'lsa:
> ```sql
> create extension if not exists pg_cron;
> create extension if not exists pg_net;
> ```

## 4. Test push tekshirish

Eng oson yo‘l: Android ilovada **Profil → Beta AI sozlamalari → Test push yuborish** tugmasini bosing.

Tugma ishlashi uchun quyidagilar tayyor bo‘lishi shart:

1. Android notification ruxsati berilgan;
2. `profiles.fcm_token` bemor profiliga saqlangan;
3. Firebase service account secrets Edge Function’da mavjud;
4. `00019_notification_history.sql` va `00020_vitals_push_beta_settings.sql` migratsiyalari ishga tushirilgan.

Qo‘lda monitoringni ishga tushirish:

```bash
curl -X POST https://flpmqhditzfosvdtbqlw.supabase.co/functions/v1/hourly_check \
  -H "Authorization: Bearer YOUR-SERVICE-ROLE-KEY"
```

Javob: `{"ok":true,"sent":N,"push_sent":N}`.

## Muhim eslatma

- `service_role` key **juda maxfiy** — faqat server-side (edge function) da ishlating, hech qachon ilova/flutter kodiga qo'ymang.
- `.env` fayli gitignore'da (commit bo'lmaydi).
- Private key ham maxfiy — uni chat'da oshkor qilganingiz uchun, agar xavfsizlik muhim bo'lsa Firebase'da qayta generatsiya qiling.
