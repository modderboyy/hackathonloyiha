import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { patient_id, doctor_id, appointment_date, slot_start, slot_end, room_id, notes } = body;

    if (!patient_id || !doctor_id || !appointment_date || !slot_start || !slot_end) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get clinic_id from doctor
    const { data: doctor } = await supabase.from("doctors").select("clinic_id").eq("id", doctor_id).single();
    if (!doctor?.clinic_id) {
      return NextResponse.json({ error: "Doctor clinic not found" }, { status: 404 });
    }

    // Check if slot is available
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctor_id)
      .eq("appointment_date", appointment_date)
      .eq("slot_start", slot_start)
      .eq("slot_end", slot_end);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
    }

    // Generate queue code
    const queueCode = `A-${String(Math.floor(Math.random() * 10000)).padStart(3, "0")}`;

    // Create appointment
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        clinic_id: doctor.clinic_id,
        patient_id,
        doctor_id,
        appointment_date,
        slot_start,
        slot_end,
        room_id: room_id || null,
        queue_code: queueCode,
        status: "scheduled",
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, message: "Appointment created successfully" });
  } catch (error: any) {
    console.error("Appointment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const doctorId = request.nextUrl.searchParams.get("doctor_id");
    const date = request.nextUrl.searchParams.get("date");

    let query = supabase.from("appointments").select("*");

    if (doctorId) query = query.eq("doctor_id", doctorId);
    if (date) query = query.eq("appointment_date", date);

    const { data, error } = await query.order("appointment_date").order("slot_start");

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Get appointments error:", error);
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
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, message: "Appointment updated successfully" });
  } catch (error: any) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
