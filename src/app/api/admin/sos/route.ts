import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, PATCH, OPTIONS",
};

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

function queueCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `SOS-${code}`;
}

async function authenticatedUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!url || !anon || !token) return null;
  const client = createSupabaseClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser(request);
  if (!user) return response({ error: "Avtorizatsiya kerak" }, 401);
  const admin = createAdminClient();
  if (!admin) return response({ error: "Server SOS sozlamasi tayyor emas" }, 503);

  let body: { priority?: "critical" | "high" | "moderate"; location_lat?: number; location_lng?: number; message?: string };
  try { body = await request.json(); } catch { return response({ error: "Noto‘g‘ri SOS so‘rovi" }, 400); }

  const { data: profile } = await admin.from("profiles").select("patient_id").eq("id", user.id).maybeSingle();
  if (!profile?.patient_id) return response({ error: "Bemor profili klinik bemor yozuviga ulanmagan" }, 400);
  const { data: patient } = await admin.from("patients").select("id, clinic_id, full_name").eq("id", profile.patient_id).single();
  if (!patient) return response({ error: "Bemor topilmadi" }, 404);

  const lat = typeof body.location_lat === "number" && Number.isFinite(body.location_lat) ? body.location_lat : null;
  const lng = typeof body.location_lng === "number" && Number.isFinite(body.location_lng) ? body.location_lng : null;
  if (lat == null || lng == null) return response({ error: "Joylashuv aniqlanmadi. Location ruxsatini yoqing." }, 400);

  let inserted: { id: string; queue_code: string; status: string; created_at: string } | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < 3 && !inserted; attempt += 1) {
    const { data, error } = await admin
      .from("sos_alerts")
      .insert({
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        priority: body.priority ?? "critical",
        status: "open",
        queue_code: queueCode(),
        location_lat: lat,
        location_lng: lng,
        message: body.message?.slice(0, 500) || "Emergency! Patient needs immediate help",
      })
      .select("id, queue_code, status, created_at")
      .single();
    if (data) inserted = data;
    else lastError = error?.message ?? "SOS yaratilmadi";
  }
  if (!inserted) return response({ error: lastError }, 400);

  const map = `https://maps.google.com/?q=${lat},${lng}`;
  const { data: workers } = patient.clinic_id
    ? await admin.from("profiles").select("id").or(`clinic_id.eq.${patient.clinic_id},facility_id.eq.${patient.clinic_id}`).in("role", ["medical_worker", "clinic_admin", "hospital_doctor", "family_doctor"])
    : { data: [] };
  const { data: superAdmins } = await admin.from("profiles").select("id").eq("role", "super_admin");
  const recipients = [...(workers ?? []), ...(superAdmins ?? [])].map((item) => item.id);
  if (recipients.length) {
    await admin.from("notifications").insert(recipients.map((recipient_id) => ({
      recipient_id,
      type: "alert",
      title: `SOS — ${patient.full_name}`,
      body: `Queue: ${inserted!.queue_code}. Joylashuv: ${map}`,
      patient_id: patient.id,
      source: "sos_api",
    })));
  }

  return response({ alert_id: inserted.id, queue_code: inserted.queue_code, status: inserted.status, created_at: inserted.created_at });
}

export async function PATCH(request: NextRequest) {
  const user = await authenticatedUser(request);
  if (!user) return response({ error: "Avtorizatsiya kerak" }, 401);
  const admin = createAdminClient();
  if (!admin) return response({ error: "Server SOS sozlamasi tayyor emas" }, 503);

  let body: { alert_id?: string };
  try { body = await request.json(); } catch { return response({ error: "Noto‘g‘ri so‘rov" }, 400); }
  if (!body.alert_id) return response({ error: "alert_id kerak" }, 400);

  const { data: profile } = await admin.from("profiles").select("patient_id").eq("id", user.id).maybeSingle();
  if (!profile?.patient_id) return response({ error: "Bemor profili topilmadi" }, 400);
  const { data: alert, error } = await admin
    .from("sos_alerts")
    .update({ status: "cancelled" })
    .eq("id", body.alert_id)
    .eq("patient_id", profile.patient_id)
    .eq("status", "open")
    .select("id, queue_code, status")
    .maybeSingle();
  if (error || !alert) return response({ error: error?.message ?? "SOS bekor qilinmadi yoki allaqachon qabul qilingan" }, 400);
  return response({ alert_id: alert.id, queue_code: alert.queue_code, status: alert.status });
}
