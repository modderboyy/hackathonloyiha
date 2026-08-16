"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createDischargeAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const patientId = formData.get("patient_id") as string;
  const requiresFollowUp = formData.get("requires_follow_up") === "on";
  const followUpDays = parseInt((formData.get("follow_up_days") as string) || "7", 10);

  // 1. Statsionar davolanish yozuvi yaratish
  const { data: hospitalization, error: hospError } = await supabase
    .from("hospitalizations")
    .insert({
      patient_id: patientId,
      doctor_id: user.id,
      admission_date: (formData.get("admission_date") as string) || new Date().toISOString().slice(0, 10),
      diagnosis: (formData.get("diagnosis") as string) || null,
      status: "discharged",
    })
    .select()
    .single();

  if (hospError) return { error: hospError.message };

  // 2. Chiqarish (discharge) yozuvi
  const { error: dischargeError } = await supabase.from("discharges").insert({
    hospitalization_id: hospitalization.id,
    patient_id: patientId,
    doctor_id: user.id,
    discharge_date: (formData.get("discharge_date") as string) || new Date().toISOString().slice(0, 10),
    summary: (formData.get("summary") as string) || null,
    recommendations: (formData.get("recommendations") as string) || null,
    requires_follow_up: requiresFollowUp,
    follow_up_days: requiresFollowUp ? followUpDays : null,
    assigned_family_doctor_id: (formData.get("assigned_family_doctor_id") as string) || null,
  });

  if (dischargeError) return { error: dischargeError.message };

  redirect("/dashboard/discharges");
}

export async function completeFollowUpAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("follow_ups")
    .update({
      status: "completed",
      result_notes: (formData.get("result_notes") as string) || null,
      next_step: (formData.get("next_step") as string) || null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  redirect("/dashboard/follow-ups");
}

export async function markNotificationReadAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("recipient_id", user.id);
}
