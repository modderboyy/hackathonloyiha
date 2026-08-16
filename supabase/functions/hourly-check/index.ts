// =====================================================================
// CareLink — Hourly AI Check-in (Supabase Edge Function)
// Har soatda premium mijozlarga shaxsiy AI savol yuboradi va eskalatsiya qiladi:
//   push notification → javob bo'lmasa SMS (demo) → hali ham bo'lmasa BLOKLASH
//
// Ishlatish: supabase functions deploy hourly-check
// Rejalashtirish: pg_cron yoki tashqi cron → POST /functions/v1/hourly-check
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY")!; // Firebase Cloud Messaging (push)
const SMS_DEMO = true; // hozircha SMS demo (haqiqiy Twilio/etc keyinroq)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// ---------- OpenAI orqali shaxsiy savol yaratish ----------
async function generateCheckinMessage(health: any): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "Salom! O'zingizni qanday his qilyapsiz? Yaxshimisiz yoki yomonmisiz?";
  }
  const prompt = `Sen g'amxo'r tibbiy yordamchi bot. Bemor quyidagi holatda:
- Hozirgi kasalligi: ${health?.current_condition || "noma'lum"}
- Qon bosimi (o'rtacha): ${health?.avg_bp_sys ?? "—"}/${health?.avg_bp_dia ?? "—"}
- Puls: ${health?.avg_heart_rate ?? "—"}
- Harorat: ${health?.avg_temperature ?? "—"}°C
- SpO2: ${health?.avg_spo2 ?? "—"}%
- Allergiya: ${health?.allergies || "yo'q"}
- Dorilar: ${health?.medications || "yo'q"}

Ushbu bemorga har soatda bitta qisqa, iliq va aniq savol yoz. Savol o'zbek tilida bo'lsin, bemorni o'z holatini baholashga undasin (yaxshiman/yomonman deb javob bersin). Faqat bitta savol qaytar, izohsiz.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      max_tokens: 80,
    }),
  });
  if (!res.ok) return "O'zingizni qanday his qilyapsiz?";
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || "O'zingizni qanday his qilyapsiz?";
}

// ---------- Push notification (FCM) ----------
async function sendPush(fcmToken: string, title: string, body: string) {
  if (!FCM_SERVER_KEY || !fcmToken) return;
  try {
    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: { title, body },
        data: { type: "checkin" },
      }),
    });
  } catch (e) {
    console.error("FCM error", e);
  }
}

// ---------- SMS (demo — real provider keyinroq) ----------
async function sendSms(phone: string, message: string) {
  if (!SMS_DEMO || !phone) {
    console.log(`[SMS-DEMO] ${phone} ga yuboriladi: ${message}`);
    return;
  }
  // Haqiqiy integratsiya (Twilio, Eskiz.uz va h.k.) shu yerga:
  console.log(`[SMS-DEMO] ${phone} ga yuboriladi: ${message}`);
}

// ---------- BLOKLASH signali (telefon qulflanadi) ----------
async function triggerLock(clientId: string) {
  await supabase.from("checkins").insert({
    client_id: clientId,
    status: "locked",
    ai_message: "Javob berilmadi — qurilma qulflandi",
    escalation: 2,
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST kerak" }), { status: 405 });
  }

  const { data: clients, error } = await supabase
    .from("subscriptions")
    .select("client_id, client_health(*), profiles(phone)")
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString());

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  const results = [];
  for (const c of clients) {
    const health = c.client_health?.[0] ?? null;
    const phone = c.profiles?.phone ?? null;

    // 1. AI shaxsiy savol
    const message = await generateCheckinMessage(health);
    const { data: checkin } = await supabase
      .from("checkins")
      .insert({ client_id: c.client_id, ai_message: message, status: "sent", escalation: 0 })
      .select()
      .single();

    // 2. Push yuborish (FCM token jadvalda saqlangan bo'lishi mumkin — MVP'da phone orqali)
    await sendPush("", "CareLink tekshiruvi", message);

    results.push({ client: c.client_id, message, status: "sent", checkin: checkin?.id });
  }

  // ---------- Eskalatsiya tekshiruvi ----------
  // 1 soatdan ortiq javob berilmagan 'sent' checkinlarni SMS ga, undan keyin bloklashga o'tkazamiz
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabase
    .from("checkins")
    .select("id, client_id, escalation, client_health(client_id, emergency_contact)")
    .eq("status", "sent")
    .lt("created_at", oneHourAgo);

  if (stale) {
    for (const s of stale) {
      if (s.escalation === 0) {
        // SMS bosqichi
        const contact = s.client_health?.[0]?.emergency_contact;
        await sendSms(contact, "CareLink: javob bermadingiz. Yaxshimisiz yoki yomonmisiz?");
        await supabase.from("checkins").update({ escalation: 1, status: "sms_sent" }).eq("id", s.id);
      } else if (s.escalation >= 1) {
        // BLOKLASH
        await triggerLock(s.client_id);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
