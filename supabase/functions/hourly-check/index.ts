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

  // RS256 imzo (Web Crypto)
  const keyData = FIREBASE_PRIVATE_KEY
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
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
async function sendPush(fcmTokens: string[], title: string, body: string, data: Record<string, string>) {
  if (!FIREBASE_PROJECT_ID || fcmTokens.length === 0) {
    console.log("[FCM-DEMO] yuboriladi:", title, body);
    return;
  }
  try {
    const token = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

    // Har bir tokenga alohida xabar (V1 da registration_ids yo'q, bitta token bitta xabar)
    for (const fcmToken of fcmTokens) {
      await fetch(url, {
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
          },
        }),
      });
    }
  } catch (e) {
    console.error("FCM V1 error", e);
  }
}

// ---------- SMS (demo) ----------
async function sendSms(phone: string, message: string) {
  console.log(`[SMS-DEMO] ${phone} ga: ${message}`);
}

// ---------- Eskalatsiya ----------
async function escalateUnanswered() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabase
    .from("checkins")
    .select("id, client_id, family_step, family_notified_at")
    .in("status", ["sent", "sms_sent"])
    .lt("created_at", oneHourAgo);

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
    await sendSms(nextMember.phone, `CareLink: ${nextMember.name} (${relation})ingiz so'rovga javob bermayapti. Iltimos u bilan bog'lanib holatini so'rang.`);

    const newStep = chk.family_step + 1;
    await supabase
      .from("checkins")
      .update({
        family_step: newStep,
        family_notified_at: new Date().toISOString(),
        status: newStep >= family.length ? "locked" : "sms_sent",
      })
      .eq("id", chk.id);
  }
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST kerak" }), { status: 405 });
  }

  await escalateUnanswered();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("client_id, profiles(fcm_token)")
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString());

  const results = [];
  if (subs) {
    for (const s of subs) {
      const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      await supabase.from("checkins").insert({
        client_id: s.client_id,
        ai_message: template,
        status: "sent",
        escalation: 0,
        family_step: 0,
      });

      const fcmToken = (s as any).profiles?.fcm_token;
      if (fcmToken) {
        await sendPush([fcmToken], "CareLink — holatingizni so'raymiz", template, { type: "checkin" });
      }
      results.push({ client: s.client_id, template });
    }
  }

  return new Response(JSON.stringify({ ok: true, sent: results.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
