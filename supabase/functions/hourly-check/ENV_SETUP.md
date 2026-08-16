# Supabase Edge Function — env sozlash (qanday qilish)

Sizda Firebase **V1 API** enabled (Legacy disabled). V1 API service account orqali ishlaydi.
Men hamma narsani tayyorladim — sizga faqat 1 ta qiymat qoldi: **Supabase service_role key**.

## Kerakli 4 ta env qiymati

| Env nomi | Qiymat | Holat |
|---|---|---|
| `SUPABASE_URL` | `https://flpmqhditzfosvdtbqlw.supabase.co` | ✅ tayyor |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (service_role) | ❌ **sizdan kerak** |
| `FIREBASE_PROJECT_ID` | `carelink-ca427` | ✅ tayyor |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@carelink-ca427.iam.gserviceaccount.com` | ✅ tayyor |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----...` | ✅ tayyor |

## 1. Service role key ni olish (sizdan kerak)

1. [supabase.com](https://supabase.com) → loyihangiz (`flpmqhditzfosvdtbqlw`) → **Project Settings → API**
2. **`service_role` key** ni nusxalang (anon key emas, service_role!)
   - U `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscG1xaGRpdHpmb3N2ZHRicWx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIs...` ko'rinishida

## 2. Env'ni qo'shish (2 yo'l)

### Yo'l A — Supabase Dashboard (oson)

1. Supabase Dashboard → **Edge Functions** → `hourly-check` ni tanlang (avval deploy qilgan bo'lsangiz)
2. **Settings → Edge Function Secrets** bo'limi
3. Quyidagilarni qo'shing (birma-bir "Add secret"):

```
SUPABASE_URL = https://flpmqhditzfosvdtbqlw.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci... (service_role key)
FIREBASE_PROJECT_ID = carelink-ca427
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@carelink-ca427.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

### Yo'l B — Supabase CLI (tavsiya, bitta buyruq)

Men `supabase/functions/hourly-check/.env` faylini tayyorlab qo'ydim (private key to'g'ri formatda).
Unda faqat `SUPABASE_SERVICE_ROLE_KEY` ni o'zingiz to'ldiring.

```bash
# 1. .env dagi YOUR-SERVICE-ROLE-KEY ni haqiqiy service_role key bilan almashtiring
# 2. Supabase'ga kirish
supabase login

# 3. Loyihani bog'lash
supabase link --project-ref flpmqhditzfosvdtbqlw

# 4. Env'ni joylash (bitta buyruq)
supabase secrets set --env-file ./supabase/functions/hourly-check/.env

# 5. Edge function'ni deploy qilish
supabase functions deploy hourly-check
```

## 3. Har soatda ishga tushirish (cron)

Edge function'ni har soatda chaqirish uchun `pg_cron` (yoki tashqi cron):

```sql
-- Supabase SQL editor'da:
select cron.schedule(
  'hourly-check',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://flpmqhditzfosvdtbqlw.supabase.co/functions/v1/hourly-check',
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

## 4. Tekshirish

```bash
# Edge function'ni qo'lda chaqirib test qilish
curl -X POST https://flpmqhditzfosvdtbqlw.supabase.co/functions/v1/hourly-check \
  -H "Authorization: Bearer YOUR-SERVICE-ROLE-KEY"
```

Javob: `{"ok":true,"sent":N}` — N = faol obunachilar soni.

## Muhim eslatma

- `service_role` key **juda maxfiy** — faqat server-side (edge function) da ishlating, hech qachon ilova/flutter kodiga qo'ymang.
- `.env` fayli gitignore'da (commit bo'lmaydi).
- Private key ham maxfiy — uni chat'da oshkor qilganingiz uchun, agar xavfsizlik muhim bo'lsa Firebase'da qayta generatsiya qiling.
