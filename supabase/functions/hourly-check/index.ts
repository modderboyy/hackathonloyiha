// =====================================================================
// CareLink — Hourly Check-in (Edge Function)
// Har soatda faol obunali bemorlarga push + template so'rov yuboradi.
// Javob 1 soat ichida kelmasa → oila a'zolariga SMS (yaqinlik tartibida,
// har 5 daqiqada bittadan) — javob qaytsa to'xtaydi.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_REST_KEY = Deno.env.get("ONESIGNAL_REST_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Template so'rovlar (AI emas — oddiy, iliq so'zlar)
const TEMPLATES = [
  "Ahvolingiz yaxshimi? Biror narsa bezovta qilmayabtimi?",
  "Salom! O'zingizni bugun qanday his qilyapsiz?",
  "Dorilarni qabul qildingizmi? O'zingizni yaxshi his qilyapsizmi?",
  "Biror og'riq yoki noqulaylik sezyapsizmi?",
  "Nafas olishingiz va uyqungiz yaxshimi?",
];

// ---------- OneSignal push ----------
async function sendPush(onesignalIds: string[], title: string, body: string, data: Record<string, string>) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    console.log("[PUSH-DEMO] yuboriladi:", title, body);
    return;
  }
  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: onesignalIds,
        headings: { en: title },
        contents: { en: body },
        data,
      }),
    });
  } catch (e) {
    console.error("OneSignal error", e);
  }
}

// ---------- SMS (demo — haqiqiy provider keyinroq) ----------
async function sendSms(phone: string, message: string) {
  // Haqiqiy SMS provider (Twilio, Eskiz.uz va h.k.) shu yerga ulanadi
  console.log(`[SMS-DEMO] ${phone} ga: ${message}`);
}

// ---------- Javob berilmagan checkinlarni topish va eskalatsiya ----------
async function escalateUnanswered() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: stale } = await supabase
    .from("checkins")
    .select("id, client_id, family_step, family_notified_at")
    .in("status", ["sent", "sms_sent"])
    .lt("created_at", oneHourAgo);

  if (!stale) return;

  for (const chk of stale) {
    // Oxirgi oila xabari 5 daqiqadan oldin bo'lsa (5 daqiqa kutish)
    if (chk.family_notified_at) {
      const lastNotified = new Date(chk.family_notified_at);
      if (Date.now() - lastNotified.getTime() < 5 * 60 * 1000) continue;
    }

    // Oila a'zolarini yaqinlik tartibida olish
    const { data: family } = await supabase
      .from("family_members")
      .select("name, phone, relationship")
      .eq("client_id", chk.client_id)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (!family || family.length === 0) {
      // Oila a'zosi yo'q — bloklash
      await supabase.from("checkins").update({ status: "locked", family_step: chk.family_step }).eq("id", chk.id);
      continue;
    }

    const nextMember = family[chk.family_step % family.length];
    if (!nextMember) continue;

    const relation = nextMember.relationship || "qarindosh";
    await sendSms(
      nextMember.phone,
      `CareLink: ${nextMember.name} (${relation})ingiz so'rovga javob bermayapti. Iltimos u bilan bog'lanib holatini so'rang.`
    );

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

// ---------- Asosiy handler ----------
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST kerak" }), { status: 405 });
  }

  // 1. Eskalatsiya (javob berilmaganlar)
  await escalateUnanswered();

  // 2. Yangi so'rov yuborish (faol obunachilarga)
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("client_id, profiles(onesignal_id)")
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

      const onesignalId = (s as any).profiles?.onesignal_id;
      if (onesignalId) {
        await sendPush([onesignalId], "CareLink — holatingizni so'raymiz", template, { type: "checkin" });
      }

      results.push({ client: s.client_id, template });
    }
  }

  return new Response(JSON.stringify({ ok: true, sent: results.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
