"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  if (!email || !password) return { error: "Email va parolni kiriting." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed" || error.message?.toLowerCase().includes("confirm")) return { error: "Email hali tasdiqlanmagan. Pochta qutingizdagi havolani bosing." };
    if (error.code === "invalid_credentials" || error.message?.toLowerCase().includes("invalid login")) return { error: "Email yoki parol noto‘g‘ri." };
    return { error: "Kirishda xatolik yuz berdi. Keyinroq qayta urinib ko‘ring." };
  }
  redirect("/dashboard");
}

/** Bemor uchun individual CareLink hisobi. Klinik xodim hisobini super admin yaratadi. */
export async function signupAction(formData: FormData) {
  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  if (!fullName || !email || !password) return { error: "Ism-familiya, email va parol majburiy." };
  if (password.length < 8) return { error: "Parol kamida 8 belgidan iborat bo‘lishi kerak." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone: phone || null, role: "patient" },
    },
  });
  if (error) return { error: error.message };
  if (data.user && !data.session) return { error: "Hisob yaratildi. Davom etish uchun emailingizga yuborilgan tasdiqlash havolasini bosing." };
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
