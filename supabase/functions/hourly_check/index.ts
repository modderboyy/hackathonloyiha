// =====================================================================
// CareLink — Hourly Check-in (Edge Function) — Firebase V1 API bilan
// Har soatda faol obunali bemorlarga push + template so'rov yuboradi.
// Firebase Cloud Messaging API (V1) — OAuth2 (service account) orqali.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Firebase V1 API (service account) uchun env o'zgaruvchilari
// Firebase Console > Project Settings > Service Accounts > "Generate new private key"
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!; // masalan: carelink-ca427
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!; // ...@...gserviceaccount.com
const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY")!; // -----BEGIN PRIVATE KEY-----

// Generic SMS provider webhook. Eskiz/Twilio/custom backend shu webhook orqali ulanadi.
const SMS_WEBHOOK_URL = Deno.env.get("SMS_WEBHOOK_URL") ?? "";
const SMS_WEBHOOK_TOKEN = Deno.env.get("SMS_WEBHOOK_TOKEN") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const TEMPLATES = [
  "Ahvolingiz yaxshimi? Biror narsa bezovta qilmayabtimi?",
  "Salom! O'zingizni bugun qanday his qilyapsiz?",
  "Dorilarni qabul qildingizmi? O'zingizni yaxshi his qilyapsizmi?",
  "Biror og'riq yoki noqulaylik sezyapsizmi?",
  "Nafas olishingiz va uyqungiz yaxshimi?",
];

// ---------- OAuth2 access token olish (service account JWT) ----------
let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const jwt = `${encode(header)}.${encode(claim)}`;

  // RS256 imzo (Web Crypto). Secret ba'zan literal \n yoki to'liq
  // service-account JSON ko'rinishida saqlanadi; ikkalasini ham qabul qilamiz.
  let privateKey = FIREBASE_PRIVATE_KEY.trim();
  if (privateKey.startsWith("{")) {
    try {
      privateKey = JSON.parse(privateKey).private_key ?? privateKey;
    } catch (_) {
      throw new Error("FIREBASE_PRIVATE_KEY JSON formati noto‘g‘ri");
    }
  }
  privateKey = privateKey.replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");
  const keyData = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/=]+$/.test(keyData)) {
    throw new Error("FIREBASE_PRIVATE_KEY base64 formati noto‘g‘ri");
  }
  const binary = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(jwt)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const signedJwt = `${jwt}.${sigB64}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
  });
  const json = await res.json();
  if (!json.access_token) {
    throw new Error("OAuth2 token olinmadi: " + JSON.stringify(json));
  }
  cachedToken = { token: json.access_token, expires: Date.now() + (json.expires_in - 60) * 1000 };
  return json.access_token;
}

// ---------- Firebase V1 push ----------
type PushResult = { ok: boolean; error?: string; detail?: string; stage?: "config" | "oauth" | "send" };

function safeFcmDetail(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  // Private key/tokenni qaytarmasdan faqat tashxis uchun qisqa izoh beramiz.
  return message
    .replace(/Bearer\s+[^\s]+/g, "Bearer [redacted]")
    .replace(/-----BEGIN[\s\S]*?END[^-]*-----/g, "[private-key-redacted]")
    .slice(0, 240);
}

async function sendPush(fcmTokens: string[], title: string, body: string, data: Record<string, string>): Promise<PushResult> {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.log("[FCM-NOT-CONFIGURED]", title, body);
    return { ok: false, error: "Firebase service account sozlanmagan", stage: "config" };
  }
  if (fcmTokens.length === 0) {
    return { ok: false, error: "Qurilma FCM tokeni topilmadi", stage: "config" };
  }

  try {
    const token = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
    let sent = 0;
    let lastError = "";

    for (const fcmToken of fcmTokens) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body },
            data,
            android: {
              priority: "HIGH",
              notification: { channel_id: "carelink_checkin", sound: "default" },
            },
          },
        }),
      });
      if (response.ok) sent += 1;
      else lastError = await response.text();
    }

    return sent > 0
      ? { ok: true }
      : { ok: false, error: "Firebase FCM xabari rad etildi", detail: lastError || "FCM javobi bo‘sh", stage: "send" };
  } catch (e) {
    const detail = safeFcmDetail(e);
    console.error("FCM V1 error", detail);
    const oauth = detail.includes("OAuth2") || detail.includes("pkcs8") || detail.includes("base64") || detail.includes("InvalidCharacter");
    return {
      ok: false,
      error: oauth ? "Firebase OAuth/private key xatosi" : "FCM ulanish xatosi",
      detail,
      stage: oauth ? "oauth" : "send",
    };
  }
}

// ---------- SMS provider ----------
async function sendSms(phone: string, message: string) {
  if (!SMS_WEBHOOK_URL) {
    console.log(`[SMS-NOT-CONFIGURED] ${phone}: ${message}`);
    return { ok: false, error: "SMS_WEBHOOK_URL sozlanmagan" };
  }
  try {
    const response = await fetch(SMS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SMS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${SMS_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ phone, message }),
    });
    return response.ok ? { ok: true } : { ok: false, error: await response.text() };
  } catch (_) {
    return { ok: false, error: "SMS provider ulanish xatosi" };
  }
}

// ---------- Eskalatsiya ----------
async function escalateUnanswered() {
  // Bemor 25 minut ichida AI check-in xabariga javob bermasa, eng yaqin
  // (priority=1 yoki location bo'yicha) yaqin odamga SMS yuboriladi.
  const twentyFiveMinutesAgo = new Date(Date.now() - 25 * 60 * 1000).toISOString();
  const { data: stale } = await supabase
    .from("checkins")
    .select("id, client_id, family_step, family_notified_at")
    .in("status", ["sent", "sms_sent"])
    .lt("created_at", twentyFiveMinutesAgo);

  if (!stale) return;

  for (const chk of stale) {
    if (chk.family_notified_at) {
      const lastNotified = new Date(chk.family_notified_at);
      if (Date.now() - lastNotified.getTime() < 5 * 60 * 1000) continue;
    }

    const { data: family } = await supabase
      .from("family_members")
      .select("name, phone, relationship")
      .eq("client_id", chk.client_id)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (!family || family.length === 0) {
      await supabase.from("checkins").update({ status: "locked", family_step: chk.family_step }).eq("id", chk.id);
      continue;
    }

    const nextMember = family[chk.family_step % family.length];
    if (!nextMember) continue;

    const relation = nextMember.relationship || "qarindosh";
    const sms = await sendSms(nextMember.phone, `CareLink: ${nextMember.name} (${relation})ingiz 25 minutdan beri AI tekshiruviga javob bermayapti. Iltimos darhol holatini so'rang.`);
    await supabase.from("notifications").insert({
      recipient_id: chk.client_id,
      type: "alert",
      title: "Yaqin odamga SMS yuborildi",
      body: sms.ok ? `${nextMember.name}ga yordam so'rovi yuborildi.` : `SMS yuborilmadi: ${sms.error}`,
      source: "sms_escalation",
    });

    const newStep = chk.family_step + 1;
    await supabase
      .from("checkins")
      .update({
        family_step: newStep,
        family_notified_at: new Date().toISOString(),
        status: sms.ok ? (newStep >= family.length ? "locked" : "sms_sent") : "escalated",
      })
      .eq("id", chk.id);
  }
}

// ---------- Monitoring / push helpers ----------
const CHECKIN_TITLE = "CareLink — holatingizni so'raymiz";

async function savePushHistory(clientId: string, title: string, body: string, source = "push") {
  await supabase.from("notifications").insert({
    recipient_id: clientId,
    type: "info",
    title,
    body,
    source,
  });
}

async function runMonitoring() {
  const now = new Date();
  const nowIso = now.toISOString();
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("client_id, profiles(fcm_token)")
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`);

  if (!subs || subs.length === 0) return [];
  const clientIds = subs.map((sub) => sub.client_id);
  const { data: settings } = await supabase
    .from("patient_monitoring_settings")
    .select("client_id, enabled, interval_minutes, last_checkin_at")
    .in("client_id", clientIds);
  const settingsMap = new Map((settings ?? []).map((setting) => [setting.client_id, setting]));
  const results: { client: string; push: boolean }[] = [];

  for (const sub of subs) {
    const setting = settingsMap.get(sub.client_id);
    const enabled = setting?.enabled ?? true;
    const intervalMinutes = Math.min(Math.max(setting?.interval_minutes ?? 60, 1), 1440);
    const lastCheckin = setting?.last_checkin_at ? new Date(setting.last_checkin_at) : null;
    const due = !lastCheckin || now.getTime() - lastCheckin.getTime() >= intervalMinutes * 60_000;
    if (!enabled || !due) continue;

    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    await supabase.from("checkins").insert({
      client_id: sub.client_id,
      ai_message: template,
      status: "sent",
      escalation: 0,
      family_step: 0,
    });
    await savePushHistory(sub.client_id, CHECKIN_TITLE, template);

    const fcmToken = (sub as any).profiles?.fcm_token as string | undefined;
    const push = await sendPush(fcmToken ? [fcmToken] : [], CHECKIN_TITLE, template, { type: "checkin" });
    if (!push.ok) console.log(`[PUSH-SKIPPED] ${sub.client_id}: ${push.error}`);

    await supabase.from("patient_monitoring_settings").upsert({
      client_id: sub.client_id,
      enabled,
      interval_minutes: intervalMinutes,
      last_checkin_at: nowIso,
      updated_at: nowIso,
    });
    results.push({ client: sub.client_id, push: push.ok });
  }

  return results;
}

async function handleTestPush(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const jwt = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return new Response(JSON.stringify({ ok: false, error: "Avtorizatsiya kerak" }), { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  const user = userData.user;
  if (userError || !user) return new Response(JSON.stringify({ ok: false, error: "Session topilmadi" }), { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("fcm_token")
    .eq("id", user.id)
    .maybeSingle();
  const fcmToken = profile?.fcm_token as string | null;
  if (!fcmToken) {
    return new Response(JSON.stringify({ ok: false, error: "FCM token topilmadi. Android notification ruxsatini bering va ilovani qayta oching." }), { status: 400 });
  }

  const title = "CareLink test push";
  const body = "Test muvaffaqiyatli: Android push notification kanali ishlayapti.";
  await savePushHistory(user.id, title, body, "push_test");
  const result = await sendPush([fcmToken], title, body, { type: "test_push" });
  if (!result.ok) {
    return new Response(JSON.stringify({
      ok: false,
      error: result.error ?? "Push yuborilmadi",
      detail: result.detail ?? null,
      stage: result.stage ?? null,
    }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: true, message: "Test push yuborildi" }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST kerak" }), { status: 405 });
  }

  let body: { action?: string } = {};
  try { body = await req.json(); } catch { /* cron request body bo'sh bo'lishi mumkin */ }
  if (body.action === "test_push") return handleTestPush(req);

  await escalateUnanswered();
  const results = await runMonitoring();
  return new Response(JSON.stringify({ ok: true, sent: results.length, push_sent: results.filter((item) => item.push).length }), {
    headers: { "Content-Type": "application/json" },
  });
});
