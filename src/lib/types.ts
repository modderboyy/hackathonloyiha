// CareLink — umumiy tiplar
// Ishchi mahsulotdagi ro'llar: super_admin, medical_worker, patient.
// Quyidagi legacy qiymatlar faqat oldingi ma'lumotlarni migratsiya qilish uchun turda qoldirilgan.
export type Role =
  | "super_admin"
  | "medical_worker"
  | "patient"
  | "admin"
  | "district_admin"
  | "clinic_admin"
  | "hospital_doctor"
  | "family_doctor"
  | "client";

export interface Profile {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  role: Role;
  phone: string | null;
  facility_id: string | null;
  clinic_id: string | null;
  region_id: string | null;
  district_id: string | null;
  neighborhood_id: string | null;
  specialty_id: string | null;
  patient_id: string | null;
  created_at?: string;
}

export interface Specialty {
  id: string;
  name: string;
  code: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  name: string;
  region_id: string;
  lat: number | null;
  lng: number | null;
  polygon: { lat: number; lng: number }[] | null;
}

export interface Neighborhood {
  id: string;
  name: string;
  district_id: string;
  lat: number | null;
  lng: number | null;
  polygon: { lat: number; lng: number }[] | null;
}

export interface Street {
  id: string;
  name: string;
  neighborhood_id: string;
}

export interface Building {
  id: string;
  number: string;
  name: string | null;
  street_id: string;
}

export type ApprovalStatus = "pending_region" | "pending_republic" | "approved" | "rejected";

export interface Approval {
  id: string;
  type: "staff_join" | "district_assign" | "other";
  title: string;
  payload: Record<string, unknown>;
  district_id: string | null;
  region_id: string | null;
  submitted_by: string | null;
  status: ApprovalStatus;
  region_decision: "approve" | "reject" | null;
  region_decided_by: string | null;
  region_decided_at: string | null;
  republic_decision: "approve" | "reject" | null;
  republic_decided_by: string | null;
  republic_decided_at: string | null;
  created_at: string;
}

export type ClinicSubscriptionStatus = "active" | "inactive" | "expired" | "trial";

export interface Facility {
  id: string;
  name: string;
  type: "polyclinic" | "hospital" | "family_clinic" | "other";
  region_id: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number | null;
  is_active?: boolean;
  subscription_status?: ClinicSubscriptionStatus;
  subscription_expires_at?: string | null;
  activated_at?: string | null;
}

export interface Patient {
  id: string;
  pinfl: string | null;
  full_name: string;
  birth_date: string | null;
  gender: "male" | "female" | "other" | null;
  phone: string | null;
  // clinic-first schema: ma'lumotlar faqat shu klinikadagi xodimlarga ko'rinadi.
  clinic_id?: string | null;
  region_id: string | null;
  district_id: string | null;
  neighborhood_id: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
}

export interface ClinicalVisit {
  id: string;
  patient_id: string;
  facility_id: string | null;
  clinic_id?: string | null;
  doctor_id: string | null;
  chief_complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  recommendations: string | null;
  visit_date: string;
  specialty: string | null;
  routed_to: string | null;
  status: "open" | "routed" | "in_progress" | "done";
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
  clinic_id?: string | null;
  doctor_id: string | null;
  admission_date: string;
  diagnosis: string | null;
  status: "active" | "discharged";
  code?: string | null;
  end_date?: string | null;
}

export interface Discharge {
  id: string;
  hospitalization_id: string;
  patient_id: string;
  clinic_id?: string | null;
  doctor_id: string | null;
  discharge_date: string;
  diagnosis?: string | null;
  summary: string | null;
  recommendations: string | null;
  requires_follow_up: boolean;
  follow_up_days: number | null;
  assigned_family_doctor_id: string | null;
  created_at?: string;
}

export interface FollowUp {
  id: string;
  patient_id: string;
  discharge_id: string | null;
  clinic_id?: string | null;
  family_doctor_id: string | null;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  result_notes: string | null;
  next_step: string | null;
  completed_at: string | null;
  created_at?: string;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  frequency_type?: "daily" | "hourly" | "weekly" | "as_needed";
  times_per_day?: number | null;
  interval_hours?: number | null;
  duration_days?: number | null;
  start_date?: string | null;
  times?: string[] | null;
  prescribed_by?: string | null;
  created_at?: string;
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

export interface Checkin {
  id: string;
  client_id: string;
  scheduled_at: string | null;
  ai_message: string | null;
  status: "sent" | "answered_fine" | "answered_bad" | "sms_sent" | "locked" | "escalated";
  response: string | null;
  responded_at: string | null;
  escalation: number;
  family_step: number;
  created_at: string;
}

export interface ChatMessageRow {
  id: string;
  client_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ClientHealth {
  id: string;
  client_id: string;
  current_condition: string | null;
  medical_notes: string | null;
  allergies: string | null;
  medications: string | null;
  avg_bp_sys: number | null;
  avg_bp_dia: number | null;
  avg_heart_rate: number | null;
  avg_temperature: number | null;
  avg_spo2: number | null;
  avg_weight: number | null;
  emergency_contact: string | null;
  hospital_diagnosis?: string | null;
  treatment_summary?: string | null;
  discharge_recommendations?: string | null;
  clinical_updated_at?: string | null;
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
  medical_worker: "Tibbiyot xodimi",
  patient: "Bemor",
  admin: "Tibbiyot xodimi",
  district_admin: "Tibbiyot xodimi",
  clinic_admin: "Tibbiyot xodimi",
  hospital_doctor: "Tibbiyot xodimi",
  family_doctor: "Tibbiyot xodimi",
  client: "Bemor",
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
