-- =====================================================================
-- CareLink — Migration 00012: FCM token (Firebase push)
-- =====================================================================
alter table public.profiles
  add column if not exists fcm_token text;
