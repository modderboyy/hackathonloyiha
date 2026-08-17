import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getUserProfile(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return profile;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const profile = await getUserProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Autentifikatsiya noto'g'ri" }, { status: 401 });
    }

    const body = await request.json();
    const { clinic_id, name, floor, capacity, status, note } = body;

    if (!clinic_id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check access: clinic admins can only add to their clinic
    if (profile.role !== "super_admin" && profile.clinic_id !== clinic_id) {
      return NextResponse.json({ error: "Siz faqat o'z klinikangizga xona qo'sha olasiz" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        clinic_id,
        name,
        floor: floor || 1,
        capacity: capacity || 1,
        status: status || "available",
        note: note || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, message: "Room created successfully" });
  } catch (error: any) {
    console.error("Room creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const profile = await getUserProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Autentifikatsiya noto'g'ri" }, { status: 401 });
    }

    const clinicId = request.nextUrl.searchParams.get("clinic_id");

    if (!clinicId) {
      return NextResponse.json({ error: "Missing clinic_id" }, { status: 400 });
    }

    // Check access: clinic admins can only view their clinic's rooms
    if (profile.role !== "super_admin" && profile.clinic_id !== clinicId) {
      return NextResponse.json({ error: "Siz faqat o'z klinikaning xonalarini ko'ra olasiz" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("floor")
      .order("name");

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Get rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const profile = await getUserProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Autentifikatsiya noto'g'ri" }, { status: 401 });
    }

    const body = await request.json();
    const { id, clinic_id, status, name, floor, capacity, note } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing room id" }, { status: 400 });
    }

    // Check access: clinic admins can only edit their clinic's rooms
    if (profile.role !== "super_admin" && profile.clinic_id !== clinic_id) {
      return NextResponse.json({ error: "Siz faqat o'z klinikaning xonalarini tahrirlay olasiz" }, { status: 403 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (name !== undefined) updates.name = name;
    if (floor !== undefined) updates.floor = floor;
    if (capacity !== undefined) updates.capacity = capacity;
    if (note !== undefined) updates.note = note;

    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, message: "Room updated successfully" });
  } catch (error: any) {
    console.error("Update room error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const profile = await getUserProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Autentifikatsiya noto'g'ri" }, { status: 401 });
    }

    const body = await request.json();
    const { id, clinic_id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing room id" }, { status: 400 });
    }

    // Check access: clinic admins can only delete their clinic's rooms
    if (profile.role !== "super_admin" && profile.clinic_id !== clinic_id) {
      return NextResponse.json({ error: "Siz faqat o'z klinikaning xonalarini o'chira olasiz" }, { status: 403 });
    }

    const { error } = await supabase.from("rooms").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error: any) {
    console.error("Delete room error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
