import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { patient_id, clinic_id, priority, location_lat, location_lng, message } = body;

    // Create SOS alert
    const { data, error } = await supabase
      .from("sos_alerts")
      .insert({
        patient_id: patient_id || null,
        clinic_id: clinic_id || null,
        priority: priority || "high",
        status: "open",
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        message: message || "Emergency SOS Alert",
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to connected clinics/staff
    // TODO: Implement real-time notification system (Supabase Realtime or WebSocket)
    console.log("SOS Alert created:", data);

    return NextResponse.json({ data, message: "SOS alert sent successfully" });
  } catch (error: any) {
    console.error("SOS alert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const status = request.nextUrl.searchParams.get("status");
    const clinicId = request.nextUrl.searchParams.get("clinic_id");

    let query = supabase.from("sos_alerts").select("*");

    if (status) query = query.eq("status", status);
    if (clinicId) query = query.eq("clinic_id", clinicId);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Get SOS alerts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sos_alerts")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, message: "SOS alert updated successfully" });
  } catch (error: any) {
    console.error("Update SOS alert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
