import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ClinicBody = {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number | null;
  subscription_status?: "active" | "inactive" | "expired" | "trial";
  subscription_expires_at?: string | null;
  type?: "polyclinic" | "hospital" | "family_clinic" | "other";
};

function safeText(value: unknown, max = 250) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sanitize(input: ClinicBody) {
  const status = ["active", "inactive", "expired", "trial"].includes(input.subscription_status ?? "") ? input.subscription_status : "inactive";
  return {
    name: safeText(input.name, 160),
    email: safeText(input.email, 254).toLowerCase(),
    phone: safeText(input.phone, 40) || null,
    address: safeText(input.address, 300) || null,
    lat: typeof input.lat === "number" && Number.isFinite(input.lat) ? input.lat : null,
    lng: typeof input.lng === "number" && Number.isFinite(input.lng) ? input.lng : null,
    radius_km: typeof input.radius_km === "number" && input.radius_km > 0 && input.radius_km <= 100 ? input.radius_km : 3,
    subscription_status: status,
    subscription_expires_at: typeof input.subscription_expires_at === "string" && input.subscription_expires_at ? input.subscription_expires_at : null,
    type: ["polyclinic", "hospital", "family_clinic", "other"].includes(input.type ?? "") ? input.type : "hospital",
  };
}

async function assertSuperAdmin() {
  const authClient = await createClient();
  const { data: userData } = await authClient.auth.getUser();
  const user = userData.user;
  if (!user) return { error: "Avtorizatsiya kerak.", status: 401 } as const;
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin") return { error: "Faqat super admin klinikani boshqara oladi.", status: 403 } as const;
  return { user, status: 200 } as const;
}

export async function POST(request: NextRequest) {
  const authorized = await assertSuperAdmin();
  if ("error" in authorized) return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY sozlanmagan. Klinik loginini yaratish uchun server kalitini .env.local ga qo‘shing." }, { status: 503 });

  let body: ClinicBody;
  try { body = await request.json() as ClinicBody; } catch { return NextResponse.json({ error: "Noto‘g‘ri so‘rov formati." }, { status: 400 }); }
  const payload = sanitize(body);
  const password = safeText(body.password, 128);
  if (!payload.name || !payload.email || !password) return NextResponse.json({ error: "Klinika nomi, email va vaqtinchalik parol majburiy." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Parol kamida 8 belgidan iborat bo‘lishi kerak." }, { status: 400 });
  if (payload.lat != null && (payload.lat < 36.7 || payload.lat > 46.4 || payload.lng == null || payload.lng < 55 || payload.lng > 74.7)) return NextResponse.json({ error: "Klinika joylashuvi O‘zbekiston chegarasida bo‘lishi kerak." }, { status: 400 });

  const isActive = payload.subscription_status === "active" || payload.subscription_status === "trial";
  const { data: facility, error: facilityError } = await admin.from("facilities").insert({ ...payload, is_active: isActive, activated_at: isActive ? new Date().toISOString() : null }).select().single();
  if (facilityError || !facility) return NextResponse.json({ error: facilityError?.message ?? "Klinika saqlanmadi." }, { status: 400 });

  const { data: account, error: accountError } = await admin.auth.admin.createUser({
    email: payload.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `${payload.name} · tibbiyot xodimi`, role: "medical_worker" },
  });
  if (accountError || !account.user) {
    await admin.from("facilities").delete().eq("id", facility.id);
    return NextResponse.json({ error: accountError?.message ?? "Klinika loginini yaratib bo‘lmadi." }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").update({ role: "medical_worker", clinic_id: facility.id, full_name: `${payload.name} · tibbiyot xodimi` }).eq("id", account.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(account.user.id);
    await admin.from("facilities").delete().eq("id", facility.id);
    return NextResponse.json({ error: `Klinika yaratilmadi: ${profileError.message}` }, { status: 400 });
  }

  return NextResponse.json({ facility });
}

export async function PATCH(request: NextRequest) {
  const authorized = await assertSuperAdmin();
  if ("error" in authorized) return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY sozlanmagan." }, { status: 503 });

  let body: ClinicBody;
  try { body = await request.json() as ClinicBody; } catch { return NextResponse.json({ error: "Noto‘g‘ri so‘rov formati." }, { status: 400 }); }
  const id = safeText(body.id, 80);
  if (!id) return NextResponse.json({ error: "Klinika ID kiritilmagan." }, { status: 400 });
  const payload = sanitize(body);
  if (!payload.name || !payload.email) return NextResponse.json({ error: "Klinika nomi va email majburiy." }, { status: 400 });
  const isActive = payload.subscription_status === "active" || payload.subscription_status === "trial";

  const { data: facility, error: updateError } = await admin.from("facilities").update({ ...payload, is_active: isActive, activated_at: isActive ? new Date().toISOString() : null }).eq("id", id).select().single();
  if (updateError || !facility) return NextResponse.json({ error: updateError?.message ?? "Klinika yangilanmadi." }, { status: 400 });

  const { data: worker } = await admin.from("profiles").select("id").eq("clinic_id", id).eq("role", "medical_worker").limit(1).maybeSingle();
  const password = safeText(body.password, 128);
  if (worker?.id && (password || payload.email)) {
    if (password && password.length < 8) return NextResponse.json({ error: "Yangi parol kamida 8 belgi bo‘lsin." }, { status: 400 });
    const { error: authError } = await admin.auth.admin.updateUserById(worker.id, { email: payload.email, ...(password ? { password } : {}) });
    if (authError) return NextResponse.json({ error: `Klinika saqlandi, ammo login yangilanmadi: ${authError.message}` }, { status: 400 });
  }
  return NextResponse.json({ facility });
}
