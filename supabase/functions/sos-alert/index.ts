// =====================================================================
// CareLink — SOS / 103 / yaqin odamga location bilan SMS
// SMS provider uchun SMS_WEBHOOK_URL va SMS_WEBHOOK_TOKEN secrets qo'shiladi.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SMS_WEBHOOK_URL = Deno.env.get("SMS_WEBHOOK_URL") ?? "";
const SMS_WEBHOOK_TOKEN = Deno.env.get("SMS_WEBHOOK_TOKEN") ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}

function mapLink(lat?: number | null, lng?: number | null) {
  return lat != null && lng != null ? `https://maps.google.com/?q=${lat},${lng}` : null;
}

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

function nearestFamily<T extends { priority?: number | null; location_lat?: number | null; location_lng?: number | null }>(family: T[], lat?: number | null, lng?: number | null) {
  const haversine = (a: number, b: number, c: number, d: number) => {
    const rad = (n: number) => n * Math.PI / 180;
    const R = 6371;
    const x = rad(c - a);
    const y = rad(d - b);
    const k = Math.sin(x / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(y / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(k), Math.sqrt(1 - k));
  };
  return [...family].sort((left, right) => {
    if (lat != null && lng != null && left.location_lat != null && left.location_lng != null && right.location_lat != null && right.location_lng != null) {
      return haversine(lat, lng, Number(left.location_lat), Number(left.location_lng)) - haversine(lat, lng, Number(right.location_lat), Number(right.location_lng));
    }
    return (left.priority ?? 999) - (right.priority ?? 999);
  })[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);
  if (req.method !== "POST") return json({ ok: false, error: "POST kerak" }, 405);

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ ok: false, error: "Avtorizatsiya kerak" }, 401);
  const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authData.user) return json({ ok: false, error: "Session topilmadi" }, 401);

  let payload: { action?: "sos" | "family"; lat?: number; lng?: number; message?: string };
  try { payload = await req.json(); } catch { payload = {}; }
  const action = payload.action === "family" ? "family" : "sos";
  const { data: profile } = await supabase.from("profiles").select("patient_id, full_name").eq("id", authData.user.id).maybeSingle();
  if (!profile?.patient_id) return json({ ok: false, error: "Bemor profili klinik bemor yozuviga ulanmagan" }, 400);

  const { data: patient } = await supabase.from("patients").select("id, full_name, clinic_id").eq("id", profile.patient_id).single();
  if (!patient) return json({ ok: false, error: "Bemor topilmadi" }, 404);

  const lat = Number.isFinite(payload.lat) ? payload.lat : null;
  const lng = Number.isFinite(payload.lng) ? payload.lng : null;
  const location = mapLink(lat, lng);
  const alertMessage = payload.message?.slice(0, 500) || (action === "sos" ? "Bemor SOS tugmasini bosdi." : "Bemor yaqin odamlarga yordam so'rovi yubordi.");

  const { data: sos, error: sosError } = await supabase
    .from("sos_alerts")
    .insert({ patient_id: patient.id, clinic_id: patient.clinic_id, priority: action === "sos" ? "critical" : "high", status: "open", location_lat: lat, location_lng: lng, message: alertMessage })
    .select()
    .single();
  if (sosError) return json({ ok: false, error: sosError.message }, 400);

  const { data: family } = await supabase
    .from("family_members")
    .select("name, phone, relationship, priority, location_lat, location_lng")
    .eq("client_id", authData.user.id)
    .eq("is_active", true);
  const closest = nearestFamily(family ?? [], lat, lng) as { name?: string; phone?: string; relationship?: string } | undefined;
  let sms = { ok: false, error: "Yaqin odam topilmadi" };
  if (closest?.phone) {
    const smsText = `CareLink SOS: ${patient.full_name} yordam so'rayapti.${location ? ` Joylashuv: ${location}` : " Joylashuv olinmadi."} Iltimos darhol bog'laning.`;
    sms = await sendSms(closest.phone, smsText);
  }

  // Klinikadagi tibbiyot xodimlari va super adminlar web notification oladi.
  const { data: clinicStaff } = patient.clinic_id
    ? await supabase.from("profiles").select("id").or(`clinic_id.eq.${patient.clinic_id},facility_id.eq.${patient.clinic_id}`).in("role", ["medical_worker", "clinic_admin", "hospital_doctor", "family_doctor"])
    : { data: [] };
  const { data: superAdmins } = await supabase.from("profiles").select("id").eq("role", "super_admin");
  const recipients = [...(clinicStaff ?? []), ...(superAdmins ?? [])].map((item) => item.id);
  if (recipients.length) {
    await supabase.from("notifications").insert(recipients.map((recipient_id) => ({
      recipient_id,
      type: "alert",
      title: `SOS — ${patient.full_name}`,
      body: `${alertMessage}${location ? ` ${location}` : ""}`,
      patient_id: patient.id,
      source: "sos",
    })));
  }

  return json({ ok: true, sos_id: sos.id, sms_sent: sms.ok, sms_error: sms.ok ? null : sms.error, location_link: location });
});
