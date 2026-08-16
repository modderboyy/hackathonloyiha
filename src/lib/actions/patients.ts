"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createPatientAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const regionId = formData.get("region_id") as string;

  const { data, error } = await supabase
    .from("patients")
    .insert({
      full_name: formData.get("full_name") as string,
      pinfl: (formData.get("pinfl") as string) || null,
      birth_date: (formData.get("birth_date") as string) || null,
      gender: (formData.get("gender") as string) || null,
      phone: (formData.get("phone") as string) || null,
      region_id: regionId || null,
      address: (formData.get("address") as string) || null,
      emergency_contact: (formData.get("emergency_contact") as string) || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/dashboard/patients/${data.id}`);
}

// Klinik tashrif + hayotiy ko'rsatkichlarni birgalikda yozish
export async function createVisitAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const patientId = formData.get("patient_id") as string;

  const { data: visit, error: visitError } = await supabase
    .from("clinical_visits")
    .insert({
      patient_id: patientId,
      doctor_id: user.id,
      chief_complaint: (formData.get("chief_complaint") as string) || null,
      diagnosis: (formData.get("diagnosis") as string) || null,
      notes: (formData.get("notes") as string) || null,
      recommendations: (formData.get("recommendations") as string) || null,
      visit_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (visitError) return { error: visitError.message };

  // Hayotiy ko'rsatkichlarni yozish (agar kiritilgan bo'lsa)
  const toInt = (v: FormDataEntryValue | null) => {
    const s = v as string;
    return s ? parseInt(s, 10) : null;
  };
  const toNum = (v: FormDataEntryValue | null) => {
    const s = v as string;
    return s ? parseFloat(s) : null;
  };

  const bpSys = toInt(formData.get("bp_sys"));
  const bpDia = toInt(formData.get("bp_dia"));
  const heartRate = toInt(formData.get("heart_rate"));
  const temperature = toNum(formData.get("temperature"));
  const spo2 = toInt(formData.get("spo2"));
  const weight = toNum(formData.get("weight"));

  const hasVitals =
    bpSys || bpDia || heartRate || temperature || spo2 || weight;

  if (hasVitals) {
    const { error: vitalsError } = await supabase.from("vitals").insert({
      patient_id: patientId,
      visit_id: visit.id,
      recorded_by: user.id,
      bp_sys: bpSys,
      bp_dia: bpDia,
      heart_rate: heartRate,
      temperature: temperature,
      spo2: spo2,
      weight: weight,
      measured_at: new Date().toISOString(),
    });
    if (vitalsError) return { error: vitalsError.message };
  }

  redirect(`/dashboard/patients/${patientId}`);
}
