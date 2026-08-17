import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PaymentTarget = "clinic" | "individual";

type PaymentRequest = {
  target?: PaymentTarget;
  clinicId?: string;
  // Kartaning hech qanday rekviziti qabul qilinmaydi yoki saqlanmaydi.
  // Bu endpoint faqat demo to'lov muvaffaqiyatini modellashtiradi.
};

const clinicPriceUsd = 29;
const individualPriceUsd = 5;

function expiresIn30Days() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

export async function POST(request: NextRequest) {
  let body: PaymentRequest;
  try {
    body = await request.json() as PaymentRequest;
  } catch {
    return NextResponse.json({ error: "Noto‘g‘ri to‘lov so‘rovi." }, { status: 400 });
  }

  const target = body.target;
  if (target !== "clinic" && target !== "individual") {
    return NextResponse.json({ error: "To‘lov turi topilmadi." }, { status: 400 });
  }

  // Lokal previewda ham checkout oqimini sinash mumkin.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({
      ok: true,
      demo: true,
      receipt: `DEMO-${Date.now().toString(36).toUpperCase()}`,
      expiresAt: expiresIn30Days(),
      amount: target === "clinic" ? clinicPriceUsd : individualPriceUsd,
    });
  }

  const userClient = await createClient();
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "To‘lov uchun tizimga kiring." }, { status: 401 });
  }

  const { data: profile } = await userClient
    .from("profiles")
    .select("id, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Foydalanuvchi profili topilmadi." }, { status: 403 });
  }

  const expiresAt = expiresIn30Days();
  const receipt = `DEMO-${Date.now().toString(36).toUpperCase()}`;

  if (target === "clinic") {
    if (profile.role !== "super_admin") {
      return NextResponse.json({ error: "Klinika obunasini faqat super admin faollashtira oladi." }, { status: 403 });
    }
    if (!body.clinicId) {
      return NextResponse.json({ error: "Klinika tanlanmagan." }, { status: 400 });
    }

    // Avval super_admin RLS orqali, kerak bo'lsa service-role server client orqali yozamiz.
    const db = createAdminClient() ?? userClient;
    const { data: facility, error } = await db
      .from("facilities")
      .update({
        subscription_status: "active",
        subscription_expires_at: expiresAt,
        is_active: true,
        activated_at: new Date().toISOString(),
      })
      .eq("id", body.clinicId)
      .select()
      .single();

    if (error || !facility) {
      return NextResponse.json({ error: error?.message ?? "Klinika obunasi faollashtirilmadi." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, receipt, amount: clinicPriceUsd, expiresAt, facility });
  }

  const { error } = await userClient.from("subscriptions").insert({
    client_id: userData.user.id,
    type: "individual",
    plan: "premium",
    price_usd: individualPriceUsd,
    currency: "USD",
    status: "active",
    started_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, receipt, amount: individualPriceUsd, expiresAt });
}
