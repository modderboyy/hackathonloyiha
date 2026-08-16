"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { error: "Email va parolni kiriting." };
  }

  console.log("[login] urinish:", email);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[login] xato:", error.status, error.code, error.message);

    // Email tasdiqlanmagan holat uchun aniq xabar
    if (error.code === "email_not_confirmed" || error.message?.toLowerCase().includes("confirm")) {
      return {
        error:
          "Emailingiz hali tasdiqlanmagan. Pochta qutingizdagi tasdiqlash havolasini bosing (spam papkasini ham tekshiring).",
      };
    }
    if (error.code === "invalid_credentials" || error.message?.toLowerCase().includes("invalid login")) {
      return { error: "Email yoki parol noto'g'ri." };
    }
    // Boshqa xatolarni ham ko'rsatamiz (yashirmaymiz)
    return { error: `Kirishda xato: ${error.message}` };
  }

  console.log("[login] muvaffaqiyatli:", data.user?.id);
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const firstName = (formData.get("first_name") as string | null)?.trim() ?? "";
  const lastName = (formData.get("last_name") as string | null)?.trim() ?? "";
  const birthDate = (formData.get("birth_date") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null)?.trim() ?? "";
  const regionId = (formData.get("region_id") as string | null)?.trim() ?? "";
  const districtId = (formData.get("district_id") as string | null)?.trim() ?? "";
  const neighborhoodId = (formData.get("neighborhood_id") as string | null)?.trim() ?? "";

  if (!firstName || !lastName || !birthDate || !email || !password || !regionId || !districtId || !neighborhoodId) {
    return { error: "Ism, familya, tug'ilgan sana, login, parol, viloyat, tuman va mahallani to'liq kiriting." };
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        region_id: regionId,
        district_id: districtId,
        neighborhood_id: neighborhoodId,
      },
    },
  });

  if (error) {
    console.error("[signup] xato:", error.status, error.code, error.message);
    return { error: error.message };
  }

  // Email tasdiqlash yoqilgan bo'lsa — session bo'lmaydi, foydalanuvchiga xabar
  if (data.user && !data.session) {
    console.log("[signup] email tasdiqlash kerak:", data.user.id);
    return {
      error:
        "Ro'yxatdan o'tdingiz! Endi emailingizga yuborilgan tasdiqlash havolasini bosing, so'ng tizimga kiring.",
    };
  }

  const userId = data.user?.id;
  if (userId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
          region_id: regionId || null,
          district_id: districtId || null,
          neighborhood_id: neighborhoodId || null,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return { error: profileError.message };
    }
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
