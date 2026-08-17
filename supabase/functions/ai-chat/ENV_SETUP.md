# CareLink AI chat — xavfsiz OpenAI key sozlamasi

`OPENAI_API_KEY` Flutter `config.dart` yoki GitHub repositoryga yozilmaydi. U faqat Supabase Edge Function secret bo‘ladi.

## 1. Fresh key yarating

Siz yuborgan API key chatga yozilgan deb hisoblanadi. OpenAI Dashboard’da uni **revoke/rotate** qilib, yangi kalit yarating.

## 2. Supabase secrets

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set \
  SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=YOUR_FRESH_SERVICE_ROLE_KEY \
  OPENAI_API_KEY=YOUR_FRESH_OPENAI_KEY
```

## 3. Edge Function deploy

```bash
supabase functions deploy ai-chat
```

Flutter ilova endi `ai-chat` function’ga user session bilan murojaat qiladi. OpenAI key APK ichiga chiqmaydi.
