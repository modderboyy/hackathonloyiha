"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { classifyTriage } from "@/lib/triage";
import type {
  Approval,
  AuditEntry,
  Building,
  ChatMessageRow,
  Checkin,
  ClientHealth,
  ClinicalVisit,
  Discharge,
  District,
  Facility,
  FollowUp,
  Hospitalization,
  Medication,
  Neighborhood,
  Notification,
  Patient,
  Profile,
  Region,
  Role,
  Specialty,
  Street,
  Vital,
} from "./types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Faqat kalitlar kiritilmaganda UI ni ko'rish uchun lokal preview.
// Haqiqiy ma'lumotlar bo'lsa Supabase RLS ushbu ma'lumotlarni to'liq almashtiradi.
const DEMO_CLINICS: Facility[] = [
  { id: "clinic-tashkent", name: "Toshkent shahar OVaBMU", type: "hospital", email: "toshkent@carelink.uz", phone: "+998 71 205 10 30", address: "Toshkent shahri, Shifokorlar ko'chasi 12", lat: 41.3111, lng: 69.2797, radius_km: 5, is_active: true, subscription_status: "active", subscription_expires_at: "2026-12-31T00:00:00.000Z", region_id: null },
  { id: "clinic-samarkand", name: "Samarqand viloyat klinikasi", type: "hospital", email: "samarkand@carelink.uz", phone: "+998 66 233 42 20", address: "Samarqand, Universitet xiyoboni 4", lat: 39.6542, lng: 66.9597, radius_km: 4, is_active: true, subscription_status: "trial", subscription_expires_at: "2026-09-20T00:00:00.000Z", region_id: null },
  { id: "clinic-andijan", name: "Andijon yurak markazi", type: "family_clinic", email: "andijon@carelink.uz", phone: "+998 74 225 11 02", address: "Andijon, Bobur shoh ko'chasi 88", lat: 40.7821, lng: 72.3442, radius_km: 3, is_active: false, subscription_status: "inactive", region_id: null },
];

const DEMO_PROFILE: Profile = {
  id: "demo-super-admin", full_name: "Nodira Xasanova", first_name: "Nodira", last_name: "Xasanova", birth_date: null,
  role: "super_admin", phone: "+998 90 123 45 67", facility_id: null, clinic_id: null, region_id: null, district_id: null, neighborhood_id: null, specialty_id: null, patient_id: null,
};

const DEMO_PATIENTS: Patient[] = [
  { id: "patient-1", full_name: "Aziza Mirzayeva", pinfl: "51403041230012", birth_date: "1971-03-04", gender: "female", phone: "+998 90 445 36 60", clinic_id: "clinic-tashkent", region_id: null, district_id: null, neighborhood_id: null, address: "Toshkent shahri", emergency_contact: "+998 90 111 23 45", created_at: "2026-08-10T09:00:00Z" },
  { id: "patient-2", full_name: "Jasur Abdullayev", pinfl: "50712231220045", birth_date: "1966-12-23", gender: "male", phone: "+998 93 112 74 20", clinic_id: "clinic-tashkent", region_id: null, district_id: null, neighborhood_id: null, address: "Toshkent shahri", emergency_contact: "+998 90 908 80 10", created_at: "2026-08-12T11:00:00Z" },
  { id: "patient-3", full_name: "Muhammadali Karimov", pinfl: "51004011230012", birth_date: "1984-04-01", gender: "male", phone: "+998 91 333 66 50", clinic_id: "clinic-samarkand", region_id: null, district_id: null, neighborhood_id: null, address: "Samarqand shahri", emergency_contact: null, created_at: "2026-08-14T08:30:00Z" },
  { id: "patient-4", full_name: "Malika Toirova", pinfl: "50808161210089", birth_date: "1958-08-16", gender: "female", phone: "+998 97 681 11 54", clinic_id: "clinic-tashkent", region_id: null, district_id: null, neighborhood_id: null, address: "Toshkent shahri", emergency_contact: "+998 93 300 20 90", created_at: "2026-08-15T10:10:00Z" },
];
const DEMO_HOSPITALIZATIONS: Hospitalization[] = [{ id: "hosp-1", patient_id: "patient-2", facility_id: "clinic-tashkent", clinic_id: "clinic-tashkent", doctor_id: "demo-super-admin", admission_date: "2026-08-15", diagnosis: "O'tkir pnevmoniya", status: "active" }];
const DEMO_DISCHARGES: Discharge[] = [
  { id: "disc-1", hospitalization_id: "hosp-0", patient_id: "patient-1", clinic_id: "clinic-tashkent", doctor_id: "demo-super-admin", discharge_date: "2026-08-14", diagnosis: "Yurak yetishmovchiligi", summary: "Holati barqarorlashdi. Uy sharoitida davomiy davo belgilandi.", recommendations: "Bosimni har kuni kuzating, tuzni cheklang.", requires_follow_up: true, follow_up_days: 14, assigned_family_doctor_id: null },
  { id: "disc-2", hospitalization_id: "hosp-2", patient_id: "patient-4", clinic_id: "clinic-tashkent", doctor_id: "demo-super-admin", discharge_date: "2026-08-10", diagnosis: "Gipertoniya", summary: "Davolash kursi muvaffaqiyatli yakunlandi.", recommendations: "Dori jadvaliga amal qiling.", requires_follow_up: true, follow_up_days: 7, assigned_family_doctor_id: null },
];
const DEMO_FOLLOWUPS: FollowUp[] = [
  { id: "follow-1", patient_id: "patient-1", discharge_id: "disc-1", clinic_id: "clinic-tashkent", family_doctor_id: "demo-super-admin", due_date: "2026-08-28", status: "in_progress", result_notes: null, next_step: "3 kundan so'ng qon bosimi monitoringi", completed_at: null },
  { id: "follow-2", patient_id: "patient-4", discharge_id: "disc-2", clinic_id: "clinic-tashkent", family_doctor_id: "demo-super-admin", due_date: "2026-08-17", status: "completed", result_notes: "Bemorning holati yaxshi, dori qabul qilmoqda.", next_step: null, completed_at: "2026-08-17T09:00:00Z" },
];
const DEMO_CHECKINS: Checkin[] = [{ id: "check-1", client_id: "client-1", scheduled_at: "2026-08-17T08:00:00Z", ai_message: "Bugun o'zingizni qanday his qilyapsiz?", status: "answered_fine", response: "Yaxshiman", responded_at: "2026-08-17T08:03:00Z", escalation: 0, family_step: 0, created_at: "2026-08-17T08:00:00Z" }];
const DEMO_MEDICATIONS: Medication[] = [{ id: "med-1", patient_id: "patient-1", name: "Bisoprolol", dosage: "5 mg", frequency: "Kuniga 2 mahal", notes: null, frequency_type: "daily", times_per_day: 2, duration_days: 30, start_date: "2026-08-14", times: ["08:00", "20:00"] }];

export interface MedicationScheduleInput {
  name: string;
  dosage?: string;
  frequency?: string;
  notes?: string;
  frequencyType?: "daily" | "hourly" | "weekly" | "as_needed";
  timesPerDay?: number | null;
  intervalHours?: number | null;
  durationDays?: number | null;
  startDate?: string | null;
  times?: string[];
}

export interface DischargeInput {
  patientId: string;
  admissionDate: string;
  dischargeDate: string;
  diagnosis: string;
  summary: string;
  recommendations: string;
  requiresFollowUp: boolean;
  followUpDays: number;
  familyDoctorId: string | null;
  medications: MedicationScheduleInput[];
}

export interface DischargeResult {
  error: string | null;
  code: string | null;
}

export interface ClinicInput {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number | null;
  subscription_status?: "active" | "inactive" | "expired" | "trial";
  subscription_expires_at?: string | null;
  type?: Facility["type"];
}

interface Data {
  ready: boolean;
  notConfigured: boolean;
  profile: Profile | null;
  profiles: Profile[];
  regions: Region[];
  districts: District[];
  neighborhoods: Neighborhood[];
  streets: Street[];
  buildings: Building[];
  specialties: Specialty[];
  facilities: Facility[];
  patients: Patient[];
  visits: ClinicalVisit[];
  vitals: Vital[];
  hospitalizations: Hospitalization[];
  discharges: Discharge[];
  followUps: FollowUp[];
  notifications: Notification[];
  liveNotification: Notification | null;
  audit: AuditEntry[];
  approvals: Approval[];
  checkins: Checkin[];
  chatMessages: ChatMessageRow[];
  clientHealth: ClientHealth[];
  medications: Medication[];

  addPatient: (p: Omit<Patient, "id" | "created_at" | "created_by">) => Promise<string | null>;
  updatePatient: (id: string, patch: Partial<Patient>) => Promise<string | null>;
  addVisit: (
    v: Omit<ClinicalVisit, "id" | "visit_date" | "doctor_id" | "specialty" | "routed_to" | "status">,
    vt?: Partial<Omit<Vital, "id" | "measured_at" | "recorded_by">>
  ) => Promise<string | null>;
  addDischarge: (d: DischargeInput) => Promise<DischargeResult>;
  completeFollowUp: (id: string, notes: string, next: string) => Promise<string | null>;
  markNotificationRead: (id: string) => Promise<string | null>;
  deletePatient: (id: string) => Promise<string | null>;
  addClinic: (input: ClinicInput) => Promise<string | null>;
  updateClinic: (id: string, input: Partial<ClinicInput>) => Promise<string | null>;

  addRegion: (name: string, code: string) => Promise<string | null>;
  addDistrict: (name: string, regionId: string, lat?: number | null, lng?: number | null) => Promise<string | null>;
  updateDistrict: (id: string, patch: Partial<District>) => Promise<string | null>;
  deleteDistrict: (id: string) => Promise<string | null>;
  addNeighborhood: (name: string, districtId: string, lat?: number | null, lng?: number | null) => Promise<string | null>;
  updateNeighborhood: (id: string, patch: Partial<Neighborhood>) => Promise<string | null>;
  deleteNeighborhood: (id: string) => Promise<string | null>;
  addStreet: (name: string, neighborhoodId: string) => Promise<string | null>;
  updateStreet: (id: string, name: string) => Promise<string | null>;
  deleteStreet: (id: string) => Promise<string | null>;
  addBuilding: (number: string, name: string, streetId: string) => Promise<string | null>;
  updateBuilding: (id: string, patch: Partial<Building>) => Promise<string | null>;
  deleteBuilding: (id: string) => Promise<string | null>;

  setRole: (id: string, role: Role, scope?: { region_id?: string | null; district_id?: string | null; specialty_id?: string | null }) => Promise<string | null>;

  submitApproval: (a: {
    type: Approval["type"];
    title: string;
    payload: Record<string, unknown>;
    district_id?: string | null;
    region_id?: string | null;
  }) => Promise<string | null>;
  decideApproval: (id: string, level: "region" | "republic", decision: "approve" | "reject") => Promise<string | null>;
}

const Ctx = createContext<Data | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const notConfigured = !URL || !ANON;

  const supabase = useMemo(() => {
    if (notConfigured) return null;
    return createClient();
  }, [notConfigured]);

  const [ready, setReady] = useState(notConfigured);
  const [profile, setProfile] = useState<Profile | null>(notConfigured ? DEMO_PROFILE : null);
  const [profiles, setProfiles] = useState<Profile[]>(notConfigured ? [DEMO_PROFILE] : []);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>(notConfigured ? DEMO_CLINICS : []);
  const [patients, setPatients] = useState<Patient[]>(notConfigured ? DEMO_PATIENTS : []);
  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>(notConfigured ? DEMO_HOSPITALIZATIONS : []);
  const [discharges, setDischarges] = useState<Discharge[]>(notConfigured ? DEMO_DISCHARGES : []);
  const [followUps, setFollowUps] = useState<FollowUp[]>(notConfigured ? DEMO_FOLLOWUPS : []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [liveNotification, setLiveNotification] = useState<Notification | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>(notConfigured ? DEMO_CHECKINS : []);
  const [chatMessages, setChatMessages] = useState<ChatMessageRow[]>([]);
  const [clientHealth, setClientHealth] = useState<ClientHealth[]>([]);
  const [medications, setMedications] = useState<Medication[]>(notConfigured ? DEMO_MEDICATIONS : []);

  // Realtime: yangi xabarnomalar (popup uchun)
  useEffect(() => {
    if (!supabase || !profile) return;
    const channel = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${profile.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => [n, ...prev]);
          setLiveNotification(n);
          // 5 soniyadan keyin popupni yopish
          setTimeout(() => setLiveNotification(null), 5000);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (cancelled) return;
      setProfile(prof as Profile | null);

      const [
        prf, reg, dist, nbh, str, bld, spec, fac, pat, vis, vit, hosp, dis, fu, notif, aud, appr, ckin, chat, health, meds,
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("regions").select("*").order("name"),
        supabase.from("districts").select("*").order("name"),
        supabase.from("neighborhoods").select("*").order("name"),
        supabase.from("streets").select("*").order("name"),
        supabase.from("buildings").select("*").order("number"),
        supabase.from("specialties").select("*").order("name"),
        supabase.from("facilities").select("*").order("name"),
        supabase.from("patients").select("*").order("created_at", { ascending: false }),
        supabase.from("clinical_visits").select("*").order("visit_date", { ascending: false }),
        supabase.from("vitals").select("*").order("measured_at", { ascending: false }),
        supabase.from("hospitalizations").select("*").order("admission_date", { ascending: false }),
        supabase.from("discharges").select("*").order("discharge_date", { ascending: false }),
        supabase.from("follow_ups").select("*").order("due_date", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
        supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("approvals").select("*").order("created_at", { ascending: false }),
        supabase.from("checkins").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("client_health").select("*"),
        supabase.from("medications").select("*").order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      setProfiles((prf.data as Profile[]) ?? []);
      setRegions((reg.data as Region[]) ?? []);
      setDistricts((dist.data as District[]) ?? []);
      setNeighborhoods((nbh.data as Neighborhood[]) ?? []);
      setStreets((str.data as Street[]) ?? []);
      setBuildings((bld.data as Building[]) ?? []);
      setSpecialties((spec.data as Specialty[]) ?? []);
      setFacilities((fac.data as Facility[]) ?? []);
      setPatients((pat.data as Patient[]) ?? []);
      setVisits((vis.data as ClinicalVisit[]) ?? []);
      setVitals((vit.data as Vital[]) ?? []);
      setHospitalizations((hosp.data as Hospitalization[]) ?? []);
      setDischarges((dis.data as Discharge[]) ?? []);
      setFollowUps((fu.data as FollowUp[]) ?? []);
      setNotifications((notif.data as Notification[]) ?? []);
      setAudit((aud.data as AuditEntry[]) ?? []);
      setApprovals((appr.data as Approval[]) ?? []);
      setCheckins((ckin.data as Checkin[]) ?? []);
      setChatMessages((chat.data as ChatMessageRow[]) ?? []);
      setClientHealth((health.data as ClientHealth[]) ?? []);
      setMedications((meds.data as Medication[]) ?? []);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [supabase, router]);

  const addPatient = useCallback(async (p: Omit<Patient, "id" | "created_at" | "created_by">): Promise<string | null> => {
    if (!profile) return "Tizimga ulanmagan";
    const payload = { ...p, clinic_id: p.clinic_id ?? profile.clinic_id ?? null };
    if (!supabase) {
      const row = { ...payload, id: `demo-patient-${Date.now()}`, created_at: new Date().toISOString() } as Patient;
      setPatients((prev) => [row, ...prev]);
      return null;
    }
    const { data, error } = await supabase.from("patients").insert({ ...payload, created_by: profile.id }).select().single();
    if (error) return error.message;
    setPatients((prev) => [data as Patient, ...prev]);
    return null;
  }, [supabase, profile]);

  const updatePatient = useCallback(async (id: string, patch: Partial<Patient>): Promise<string | null> => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (!supabase) return null;
    const { error } = await supabase.from("patients").update(patch).eq("id", id);
    if (error) return error.message;
    return null;
  }, [supabase]);

  const addVisit = useCallback(
    async (
      v: Omit<ClinicalVisit, "id" | "visit_date" | "doctor_id" | "specialty" | "routed_to" | "status">,
      vt?: Partial<Omit<Vital, "id" | "measured_at" | "recorded_by">>
    ): Promise<string | null> => {
      if (!supabase || !profile) return "Tizimga ulanmagan";

      // AI yo'naltirish: shikoyatni tahlil qilish
      const patient = patients.find((p) => p.id === v.patient_id);
      const triage = classifyTriage(v.chief_complaint ?? "", patient?.birth_date);

      // Shu ixtisoslik va hudud bo'yicha shifokorni topish
      let routedTo: string | null = null;
      const specRow = specialties.find((s) => s.code === triage.code);
      if (specRow) {
        const candidates = profiles.filter(
          (p) =>
            (p.role === "family_doctor" || p.role === "medical_worker" || p.role === "hospital_doctor") &&
            p.specialty_id === specRow.id &&
            (patient?.district_id ? p.district_id === patient.district_id : true)
        );
        routedTo = candidates[0]?.id ?? null;
      }

      const { data: visit, error } = await supabase
        .from("clinical_visits")
        .insert({
          ...v,
          clinic_id: v.clinic_id ?? profile.clinic_id ?? null,
          doctor_id: profile.id,
          visit_date: new Date().toISOString(),
          specialty: triage.code,
          routed_to: routedTo,
          status: routedTo ? "routed" : "open",
        })
        .select()
        .single();
      if (error) return error.message;
      setVisits((prev) => [visit as ClinicalVisit, ...prev]);

      if (vt && Object.values(vt).some((x) => x !== null && x !== undefined && x !== "")) {
        const { data: vrow, error: verr } = await supabase
          .from("vitals")
          .insert({
            patient_id: v.patient_id,
            visit_id: visit.id,
            recorded_by: profile.id,
            bp_sys: vt.bp_sys ?? null,
            bp_dia: vt.bp_dia ?? null,
            heart_rate: vt.heart_rate ?? null,
            temperature: vt.temperature ?? null,
            spo2: vt.spo2 ?? null,
            weight: vt.weight ?? null,
            measured_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (!verr && vrow) setVitals((prev) => [vrow as Vital, ...prev]);
      }
      return null;
    },
    [supabase, profile, patients, specialties, profiles]
  );

  const refreshFollowupsAndNotifications = useCallback(async () => {
    if (!supabase) return;
    const [fu, notif] = await Promise.all([
      supabase.from("follow_ups").select("*").order("due_date", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }),
    ]);
    setFollowUps((fu.data as FollowUp[]) ?? []);
    setNotifications((notif.data as Notification[]) ?? []);
  }, [supabase]);

  const addDischarge = useCallback(async (d: DischargeInput): Promise<DischargeResult> => {
    if (!profile) return { error: "Tizimga ulanmagan", code: null };

    const patient = patients.find((p) => p.id === d.patientId);
    const clinicId = patient?.clinic_id ?? profile.clinic_id ?? profile.facility_id ?? null;
    if (!clinicId && profile.role !== "super_admin") {
      return { error: "Xodim klinikaga biriktirilmagan.", code: null };
    }

    // Klinik kod bemor mobil ilovasida bepul klinik obunani bog'laydi.
    const code = Array.from({ length: 8 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
    ).join("");
    const endDate = new Date(`${d.dischargeDate}T00:00:00`);
    endDate.setDate(endDate.getDate() + (d.requiresFollowUp ? d.followUpDays : 0));
    const medsPayload = d.medications.filter((m) => m.name.trim()).map((m) => ({
      patient_id: d.patientId,
      name: m.name.trim(),
      dosage: m.dosage?.trim() || null,
      frequency: m.frequency?.trim() || null,
      notes: m.notes?.trim() || null,
      frequency_type: m.frequencyType ?? "daily",
      times_per_day: m.timesPerDay ?? null,
      interval_hours: m.intervalHours ?? null,
      duration_days: m.durationDays ?? null,
      start_date: m.startDate || d.dischargeDate,
      times: m.times?.filter(Boolean) ?? null,
      prescribed_by: profile.id,
    }));

    if (!supabase) {
      const hospitalId = `demo-hosp-${Date.now()}`;
      const dischargeId = `demo-disc-${Date.now()}`;
      setHospitalizations((prev) => [{ id: hospitalId, patient_id: d.patientId, facility_id: clinicId, clinic_id: clinicId, doctor_id: profile.id, admission_date: d.admissionDate, diagnosis: d.diagnosis || null, status: "discharged", code, end_date: endDate.toISOString().slice(0, 10) }, ...prev]);
      setDischarges((prev) => [{ id: dischargeId, hospitalization_id: hospitalId, patient_id: d.patientId, clinic_id: clinicId, doctor_id: profile.id, discharge_date: d.dischargeDate, diagnosis: d.diagnosis || null, summary: d.summary || null, recommendations: d.recommendations || null, requires_follow_up: d.requiresFollowUp, follow_up_days: d.requiresFollowUp ? d.followUpDays : null, assigned_family_doctor_id: null }, ...prev]);
      if (d.requiresFollowUp) {
        const due = new Date(`${d.dischargeDate}T00:00:00`);
        due.setDate(due.getDate() + d.followUpDays);
        setFollowUps((prev) => [{ id: `demo-follow-${Date.now()}`, patient_id: d.patientId, discharge_id: dischargeId, clinic_id: clinicId, family_doctor_id: profile.id, due_date: due.toISOString().slice(0, 10), status: "pending", result_notes: null, next_step: null, completed_at: null }, ...prev]);
      }
      setMedications((prev) => [
        ...medsPayload.map((m, i) => ({ ...m, id: `demo-med-${Date.now()}-${i}`, created_at: new Date().toISOString() } as Medication)),
        ...prev,
      ]);
      return { error: null, code };
    }

    const { data: hosp, error: e1 } = await supabase
      .from("hospitalizations")
      .insert({
        patient_id: d.patientId,
        facility_id: clinicId,
        clinic_id: clinicId,
        doctor_id: profile.id,
        admission_date: d.admissionDate,
        diagnosis: d.diagnosis || null,
        status: "discharged",
        code,
        end_date: endDate.toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (e1) return { error: e1.message, code: null };
    setHospitalizations((prev) => [hosp as Hospitalization, ...prev]);

    const { data: disc, error: e2 } = await supabase
      .from("discharges")
      .insert({
        hospitalization_id: hosp.id,
        patient_id: d.patientId,
        clinic_id: clinicId,
        doctor_id: profile.id,
        discharge_date: d.dischargeDate,
        diagnosis: d.diagnosis || null,
        summary: d.summary || null,
        recommendations: d.recommendations || null,
        requires_follow_up: d.requiresFollowUp,
        follow_up_days: d.requiresFollowUp ? d.followUpDays : null,
        assigned_family_doctor_id: d.familyDoctorId,
      })
      .select()
      .single();
    if (e2) return { error: e2.message, code: null };
    setDischarges((prev) => [disc as Discharge, ...prev]);

    if (medsPayload.length > 0) {
      const { data: savedMeds, error: medError } = await supabase.from("medications").insert(medsPayload).select();
      if (medError) return { error: `Chiqarish saqlandi, ammo dorilar: ${medError.message}`, code };
      setMedications((prev) => [...((savedMeds as Medication[]) ?? []), ...prev]);
    }

    await refreshFollowupsAndNotifications();
    return { error: null, code };
  }, [supabase, profile, patients, refreshFollowupsAndNotifications]);

  const completeFollowUp = useCallback(async (id: string, notes: string, next: string): Promise<string | null> => {
    const completedAt = new Date().toISOString();
    if (supabase) {
      const { error } = await supabase.from("follow_ups").update({ status: "completed", result_notes: notes || null, next_step: next || null, completed_at: completedAt }).eq("id", id);
      if (error) return error.message;
    }
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status: "completed", result_notes: notes || null, next_step: next || null, completed_at: completedAt } : f)));
    return null;
  }, [supabase]);

  const markNotificationRead = useCallback(async (id: string): Promise<string | null> => {
    if (!supabase) return "Tizimga ulanmagan";
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    return null;
  }, [supabase]);

  const deletePatient = useCallback(async (id: string): Promise<string | null> => {
    if (supabase) {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) return error.message;
    }
    setPatients((prev) => prev.filter((p) => p.id !== id));
    return null;
  }, [supabase]);

  const addClinic = useCallback(async (input: ClinicInput): Promise<string | null> => {
    if (profile?.role !== "super_admin") return "Klinikani faqat super admin boshqara oladi.";
    if (!supabase) {
      const row: Facility = {
        id: `demo-clinic-${Date.now()}`,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        address: input.address ?? null,
        lat: input.lat ?? 41.3111,
        lng: input.lng ?? 69.2797,
        radius_km: input.radius_km ?? 3,
        subscription_status: input.subscription_status ?? "inactive",
        is_active: input.subscription_status === "active" || input.subscription_status === "trial",
        subscription_expires_at: input.subscription_expires_at ?? null,
        type: input.type ?? "hospital",
        region_id: null,
      };
      setFacilities((prev) => [row, ...prev]);
      return null;
    }
    try {
      const response = await fetch("/api/admin/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await response.json() as { error?: string; facility?: Facility };
      if (!response.ok) return payload.error ?? "Klinika yaratilmadi.";
      if (payload.facility) setFacilities((prev) => [payload.facility as Facility, ...prev]);
      return null;
    } catch {
      return "Klinikani yaratish xizmatiga ulanib bo'lmadi.";
    }
  }, [profile, supabase]);

  const updateClinic = useCallback(async (id: string, input: Partial<ClinicInput>): Promise<string | null> => {
    if (profile?.role !== "super_admin") return "Klinikani faqat super admin boshqara oladi.";
    if (!supabase) {
      setFacilities((prev) => prev.map((f) => f.id === id ? {
        ...f,
        ...input,
        is_active: input.subscription_status ? ["active", "trial"].includes(input.subscription_status) : f.is_active,
      } : f));
      return null;
    }
    try {
      const response = await fetch("/api/admin/clinics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...input }),
      });
      const payload = await response.json() as { error?: string; facility?: Facility };
      if (!response.ok) return payload.error ?? "Klinika yangilanmadi.";
      if (payload.facility) setFacilities((prev) => prev.map((f) => f.id === id ? payload.facility as Facility : f));
      return null;
    } catch {
      return "Klinikani yangilash xizmatiga ulanib bo'lmadi.";
    }
  }, [profile, supabase]);

  const addRegion = useCallback(async (name: string, code: string): Promise<string | null> => {
    if (!supabase) {
      setRegions((prev) => [...prev, { id: `reg_${Date.now()}`, name, code }]);
      return null;
    }
    const { data, error } = await supabase.from("regions").insert({ name, code }).select().single();
    if (error) return error.message;
    setRegions((prev) => [...prev, data as Region]);
    return null;
  }, [supabase]);

  const addDistrict = useCallback(async (name: string, regionId: string, lat?: number | null, lng?: number | null): Promise<string | null> => {
    if (!supabase) {
      setDistricts((prev) => [...prev, { id: `dist_${Date.now()}`, name, region_id: regionId, lat: lat ?? null, lng: lng ?? null, polygon: null }]);
      return null;
    }
    const { data, error } = await supabase.from("districts").insert({ name, region_id: regionId, lat: lat ?? null, lng: lng ?? null }).select().single();
    if (error) return error.message;
    setDistricts((prev) => [...prev, data as District]);
    return null;
  }, [supabase]);

  const updateDistrict = useCallback(async (id: string, patch: Partial<District>): Promise<string | null> => {
    if (!supabase) {
      setDistricts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
      return null;
    }
    setDistricts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    const { error } = await supabase.from("districts").update(patch).eq("id", id);
    if (error) return error.message;
    return null;
  }, [supabase]);

  const deleteDistrict = useCallback(async (id: string): Promise<string | null> => {
    if (!supabase) {
      setDistricts((prev) => prev.filter((d) => d.id !== id));
      return null;
    }
    const { error } = await supabase.from("districts").delete().eq("id", id);
    if (error) return error.message;
    setDistricts((prev) => prev.filter((d) => d.id !== id));
    return null;
  }, [supabase]);

  const addNeighborhood = useCallback(async (name: string, districtId: string, lat?: number | null, lng?: number | null): Promise<string | null> => {
    if (!supabase) {
      setNeighborhoods((prev) => [...prev, { id: `nbh_${Date.now()}`, name, district_id: districtId, lat: lat ?? null, lng: lng ?? null, polygon: null }]);
      return null;
    }
    const { data, error } = await supabase.from("neighborhoods").insert({ name, district_id: districtId, lat: lat ?? null, lng: lng ?? null }).select().single();
    if (error) return error.message;
    setNeighborhoods((prev) => [...prev, data as Neighborhood]);
    return null;
  }, [supabase]);

  const updateNeighborhood = useCallback(async (id: string, patch: Partial<Neighborhood>): Promise<string | null> => {
    if (!supabase) return "Tizimga ulanmagan";
    setNeighborhoods((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    const { error } = await supabase.from("neighborhoods").update(patch).eq("id", id);
    if (error) return error.message;
    return null;
  }, [supabase]);

  const deleteNeighborhood = useCallback(async (id: string): Promise<string | null> => {
    if (!supabase) return "Tizimga ulanmagan";
    const { error } = await supabase.from("neighborhoods").delete().eq("id", id);
    if (error) return error.message;
    setNeighborhoods((prev) => prev.filter((n) => n.id !== id));
    return null;
  }, [supabase]);

  const addStreet = useCallback(async (name: string, neighborhoodId: string): Promise<string | null> => {
    if (!supabase) {
      setStreets((prev) => [...prev, { id: `str_${Date.now()}`, name, neighborhood_id: neighborhoodId }]);
      return null;
    }
    const { data, error } = await supabase.from("streets").insert({ name, neighborhood_id: neighborhoodId }).select().single();
    if (error) return error.message;
    setStreets((prev) => [...prev, data as Street]);
    return null;
  }, [supabase]);

  const updateStreet = useCallback(async (id: string, name: string): Promise<string | null> => {
    if (!supabase) return "Tizimga ulanmagan";
    setStreets((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    const { error } = await supabase.from("streets").update({ name }).eq("id", id);
    if (error) return error.message;
    return null;
  }, [supabase]);

  const deleteStreet = useCallback(async (id: string): Promise<string | null> => {
    if (!supabase) return "Tizimga ulanmagan";
    const { error } = await supabase.from("streets").delete().eq("id", id);
    if (error) return error.message;
    setStreets((prev) => prev.filter((s) => s.id !== id));
    return null;
  }, [supabase]);

  const addBuilding = useCallback(async (number: string, name: string, streetId: string): Promise<string | null> => {
    if (!supabase) {
      setBuildings((prev) => [...prev, { id: `bld_${Date.now()}`, number, name: name || null, street_id: streetId }]);
      return null;
    }
    const { data, error } = await supabase.from("buildings").insert({ number, name: name || null, street_id: streetId }).select().single();
    if (error) return error.message;
    setBuildings((prev) => [...prev, data as Building]);
    return null;
  }, [supabase]);

  const updateBuilding = useCallback(async (id: string, patch: Partial<Building>): Promise<string | null> => {
    if (!supabase) return "Tizimga ulanmagan";
    setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const { error } = await supabase.from("buildings").update(patch).eq("id", id);
    if (error) return error.message;
    return null;
  }, [supabase]);

  const deleteBuilding = useCallback(async (id: string): Promise<string | null> => {
    if (!supabase) return "Tizimga ulanmagan";
    const { error } = await supabase.from("buildings").delete().eq("id", id);
    if (error) return error.message;
    setBuildings((prev) => prev.filter((b) => b.id !== id));
    return null;
  }, [supabase]);

  const setRole = useCallback(async (id: string, role: Role, scope?: { region_id?: string | null; district_id?: string | null; specialty_id?: string | null }): Promise<string | null> => {
    if (!supabase) return "Tizimga ulanmagan";
    const patch: Record<string, unknown> = { role };
    if (scope) {
      if ("region_id" in scope) patch.region_id = scope.region_id ?? null;
      if ("district_id" in scope) patch.district_id = scope.district_id ?? null;
      if ("specialty_id" in scope) patch.specialty_id = scope.specialty_id ?? null;
    }
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) return error.message;
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...(patch as Partial<Profile>) } : p)));
    return null;
  }, [supabase]);

  const submitApproval = useCallback(async (a: { type: Approval["type"]; title: string; payload: Record<string, unknown>; district_id?: string | null; region_id?: string | null }): Promise<string | null> => {
    if (!supabase || !profile) return "Tizimga ulanmagan";
    const { data, error } = await supabase.from("approvals").insert({ type: a.type, title: a.title, payload: a.payload, district_id: a.district_id ?? null, region_id: a.region_id ?? null, submitted_by: profile.id, status: "pending_region" }).select().single();
    if (error) return error.message;
    setApprovals((prev) => [data as Approval, ...prev]);
    return null;
  }, [supabase, profile]);

  const decideApproval = useCallback(async (id: string, level: "region" | "republic", decision: "approve" | "reject"): Promise<string | null> => {
    if (!supabase || !profile) return "Tizimga ulanmagan";
    if (level === "region") {
      const patch: Record<string, unknown> = { region_decision: decision, region_decided_by: profile.id, region_decided_at: new Date().toISOString(), status: decision === "approve" ? "approved" : "pending_republic" };
      const { error } = await supabase.from("approvals").update(patch).eq("id", id);
      if (error) return error.message;
      setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, ...(patch as Partial<Approval>) } : a)));
    } else {
      const patch: Record<string, unknown> = { republic_decision: decision, republic_decided_by: profile.id, republic_decided_at: new Date().toISOString(), status: decision === "approve" ? "approved" : "rejected" };
      const { error } = await supabase.from("approvals").update(patch).eq("id", id);
      if (error) return error.message;
      setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, ...(patch as Partial<Approval>) } : a)));
    }
    return null;
  }, [supabase, profile]);

  const value = useMemo<Data>(
    () => ({
      ready, notConfigured, profile, profiles, regions, districts, neighborhoods,
      streets, buildings, specialties, facilities, patients, visits, vitals, hospitalizations,
      discharges, followUps, notifications, liveNotification, audit, approvals, checkins, chatMessages, clientHealth, medications,
      addPatient, updatePatient, addVisit, addDischarge, completeFollowUp, markNotificationRead,
      deletePatient, addClinic, updateClinic, addRegion, addDistrict, updateDistrict, deleteDistrict, addNeighborhood,
      updateNeighborhood, deleteNeighborhood, addStreet, updateStreet, deleteStreet,
      addBuilding, updateBuilding, deleteBuilding, setRole, submitApproval, decideApproval,
    }),
    [
      ready, notConfigured, profile, profiles, regions, districts, neighborhoods,
      streets, buildings, specialties, facilities, patients, visits, vitals, hospitalizations,
      discharges, followUps, notifications, liveNotification, audit, approvals, checkins, chatMessages, clientHealth, medications,
      addPatient, updatePatient, addVisit, addDischarge, completeFollowUp, markNotificationRead,
      deletePatient, addClinic, updateClinic, addRegion, addDistrict, updateDistrict, deleteDistrict, addNeighborhood,
      updateNeighborhood, deleteNeighborhood, addStreet, updateStreet, deleteStreet,
      addBuilding, updateBuilding, deleteBuilding, setRole, submitApproval, decideApproval,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData DataProvider ichida ishlatilishi kerak");
  return ctx;
}
