import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { doctor_id, schedules } = body;

    if (!doctor_id || !schedules) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Delete existing schedules for this doctor
    await supabase.from("doctor_schedules").delete().eq("doctor_id", doctor_id);

    // Insert new schedules
    const scheduleEntries = Object.entries(schedules)
      .filter(([_, schedule]: any) => schedule.start && schedule.end)
      .map(([weekday, schedule]: any) => ({
        doctor_id,
        weekday: parseInt(weekday),
        start_time: schedule.start,
        end_time: schedule.end,
        room_name: schedule.room || null,
        is_active: true,
      }));

    if (scheduleEntries.length > 0) {
      const { error } = await supabase.from("doctor_schedules").insert(scheduleEntries);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "Schedule saved successfully" });
  } catch (error: any) {
    console.error("Schedule error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const doctorId = request.nextUrl.searchParams.get("doctor_id");

    if (!doctorId) {
      return NextResponse.json({ error: "Missing doctor_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("doctor_schedules")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("weekday");

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Get schedules error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
