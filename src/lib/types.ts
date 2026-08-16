// CareLink — umumiy tiplar

export type Role =
  | "super_admin"
  | "admin"
  | "medical_worker"
  | "hospital_doctor"
  | "family_doctor";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  phone: string | null;
  facility_id: string | null;
  region_id: string | null;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  points?: string; // xarita uchun polygon koordinatalari
  cx?: number;
  cy?: number;
}

export interface Facility {
  id: string;
  name: string;
  type: "polyclinic" | "hospital" | "family_clinic" | "other";
  region_id: string | null;
}

export interface Patient {
  id: string;
  pinfl: string | null;
  full_name: string;
  birth_date: string | null;
  gender: "male" | "female" | "other" | null;
  phone: string | null;
  region_id: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
}

export interface ClinicalVisit {
  id: string;
  patient_id: string;
  facility_id: string | null;
  doctor_id: string | null;
  chief_complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  recommendations: string | null;
  visit_date: string;
}

export interface Vital {
  id: string;
  patient_id: string;
  bp_sys: number | null;
  bp_dia: number | null;
  heart_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  weight: number | null;
  measured_at: string;
}

export interface Hospitalization {
  id: string;
  patient_id: string;
  facility_id: string | null;
  doctor_id: string | null;
  admission_date: string;
  diagnosis: string | null;
  status: "active" | "discharged";
}

export interface Discharge {
  id: string;
  hospitalization_id: string;
  patient_id: string;
  doctor_id: string | null;
  discharge_date: string;
  summary: string | null;
  recommendations: string | null;
  requires_follow_up: boolean;
  follow_up_days: number | null;
  assigned_family_doctor_id: string | null;
}

export interface FollowUp {
  id: string;
  patient_id: string;
  discharge_id: string | null;
  family_doctor_id: string | null;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  result_notes: string | null;
  next_step: string | null;
  completed_at: string | null;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: "info" | "follow_up" | "discharge" | "alert";
  title: string;
  body: string | null;
  patient_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  user_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  type: "visit" | "vital" | "hospitalization" | "discharge" | "follow_up";
  title: string;
  detail: string;
  date: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  admin: "Administrator",
  medical_worker: "Tibbiyot xodimi",
  hospital_doctor: "Statsionar shifokori",
  family_doctor: "Oilaviy shifokor",
};

export const GENDER_LABELS: Record<string, string> = {
  male: "Erkak",
  female: "Ayol",
  other: "Boshqa",
};

export const FOLLOWUP_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Kutilmoqda", cls: "bg-amber-100 text-amber-700" },
  in_progress: { label: "Jarayonda", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Yakunlandi", cls: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "Muddati o'tdi", cls: "bg-red-100 text-red-700" },
};
