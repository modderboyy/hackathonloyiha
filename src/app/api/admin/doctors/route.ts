import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type DoctorBody = {
  full_name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: "medical_worker" | "hospital_doctor" | "family_doctor";
  clinic_id?: string | null;
  facility_id?: string | null;
  specialty_id?: string | null;
};

function safeText(value: unknown, max = 250) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function assertSuperAdmin() {
  const authClient = await createClient();
  const { data: userData } = await authClient.auth.getUser();
  const user = userData.user;
  if (!user) return { error: "Avtorizatsiya kerak.", status: 401 } as const;
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin") return { error: "Faqat super admin shifokor qo‘shishi mumkin.", status: 403 } as const;
  return { user, status: 200 } as const;
}

export async function POST(request: NextRequest) {
  const authorized = await assertSuperAdmin();
  if ("error" in authorized) return NextResponse.json({ error: authorized.error }, { status: authorized.status });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY sozlanmagan." }, { status: 503 });

  let body: DoctorBody;
  try {
    body = (await request.json()) as DoctorBody;
  } catch {
    return NextResponse.json({ error: "Noto‘g‘ri so‘rov formati." }, { status: 400 });
  }

  const fullName = safeText(body.full_name, 120);
  const email = safeText(body.email, 254).toLowerCase();
  const password = safeText(body.password, 128);
  const phone = safeText(body.phone, 40) || null;
  const role = ["medical_worker", "hospital_doctor", "family_doctor"].includes(body.role ?? "") ? body.role : "medical_worker";
  const clinicId = safeText(body.clinic_id, 80) || null;
  const facilityId = safeText(body.facility_id, 80) || clinicId;
  const specialtyId = safeText(body.specialty_id, 80) || null;

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Ism, email va parol majburiy." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Parol kamida 8 belgidan iborat bo‘lishi kerak." }, { status: 400 });
  }

  if (clinicId) {
    const { data: clinic, error: clinicError } = await admin.from("facilities").select("id").eq("id", clinicId).maybeSingle();
    if (clinicError || !clinic) {
      return NextResponse.json({ error: "Klinika topilmadi." }, { status: 400 });
    }
  }

  if (specialtyId) {
    const { data: specialty, error: specialtyError } = await admin.from("specialties").select("id").eq("id", specialtyId).maybeSingle();
    if (specialtyError || !specialty) {
      return NextResponse.json({ error: "Mutaxassislik topilmadi." }, { status: 400 });
    }
  }

  const { data: account, error: accountError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  if (accountError || !account.user) {
    return NextResponse.json({ error: accountError?.message ?? "Shifokor loginini yaratib bo‘lmadi." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      phone,
      clinic_id: clinicId,
      facility_id: facilityId,
      specialty_id: specialtyId,
    })
    .eq("id", account.user.id)
    .select()
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(account.user.id);
    return NextResponse.json({ error: profileError?.message ?? "Profilni saqlashda xatolik yuz berdi." }, { status: 400 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const authorized = await assertSuperAdmin();
  if ("error" in authorized) return NextResponse.json({ error: authorized.error }, { status: authorized.status });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY sozlanmagan." }, { status: 503 });

  let body: DoctorBody & { id: string };
  try {
    body = (await request.json()) as DoctorBody & { id: string };
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov formati." }, { status: 400 });
  }

  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: "Shifokor ID majburiy." }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (updates.full_name) updateData.full_name = safeText(updates.full_name, 120);
  if (updates.phone) updateData.phone = safeText(updates.phone, 40) || null;
  if (updates.specialty_id) updateData.specialty_id = safeText(updates.specialty_id, 80) || null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? "Profil yangilanmadi." }, { status: 400 });
  }

  return NextResponse.json({ profile });
}
