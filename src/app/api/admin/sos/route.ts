import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, PATCH, GET, OPTIONS",
};

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

function queueCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `SOS-${Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")}`;
}

async function mobileUser(request: NextRequest) {
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
  let body: { priority?: "critical" | "high" | "moderate"; patient_id?: string; clinic_id?: string; location_lat?: number; location_lng?: number; message?: string };
  try { body = await request.json(); } catch { return response({ error: "Noto‘g‘ri SOS so‘rovi" }, 400); }

  // Flutter/mobile: Bearer token bilan faqat o'z patient profile orqali SOS yaratadi.
  const user = await mobileUser(request);
  if (user) {
    const admin = createAdminClient();
    if (!admin) return response({ error: "Server SOS sozlamasi tayyor emas" }, 503);

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

  // Web dashboard: cookie session/RLS orqali admin SOS yaratishi mumkin.
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sos_alerts")
    .insert({
      patient_id: body.patient_id || null,
      clinic_id: body.clinic_id || null,
      priority: body.priority || "high",
      status: "open",
      queue_code: queueCode(),
      location_lat: body.location_lat || null,
      location_lng: body.location_lng || null,
      message: body.message || "Emergency SOS Alert",
    })
    .select()
    .single();
  if (error) return response({ error: error.message }, 500);
  return response({ data, message: "SOS alert sent successfully" });
}

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const status = request.nextUrl.searchParams.get("status");
  const clinicId = request.nextUrl.searchParams.get("clinic_id");
  let query = supabase.from("sos_alerts").select("*");
  if (status) query = query.eq("status", status);
  if (clinicId) query = query.eq("clinic_id", clinicId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return response({ error: error.message }, 500);
  return response({ data });
}

export async function PATCH(request: NextRequest) {
  let body: { alert_id?: string; id?: string; status?: string };
  try { body = await request.json(); } catch { return response({ error: "Noto‘g‘ri so‘rov" }, 400); }

  // Flutter cancel: only the linked patient can cancel an open SOS.
  const user = await mobileUser(request);
  if (user && body.alert_id) {
    const admin = createAdminClient();
    if (!admin) return response({ error: "Server SOS sozlamasi tayyor emas" }, 503);
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

  // Web dashboard: clinic operator statusni open/accepted/resolved/cancelled qiladi.
  if (!body.id || !body.status) return response({ error: "id va status kerak" }, 400);
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("sos_alerts").update({ status: body.status }).eq("id", body.id).select().single();
  if (error) return response({ error: error.message }, 500);
  return response({ data, message: "SOS alert updated successfully" });
}
