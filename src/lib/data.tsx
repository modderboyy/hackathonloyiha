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
import type {
  AuditEntry,
  ClinicalVisit,
  Discharge,
  Facility,
  FollowUp,
  Hospitalization,
  Notification,
  Patient,
  Profile,
  Region,
  Role,
  Vital,
} from "./types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
}

interface Data {
  ready: boolean;
  notConfigured: boolean;
  profile: Profile | null;
  profiles: Profile[];
  regions: Region[];
  facilities: Facility[];
  patients: Patient[];
  visits: ClinicalVisit[];
  vitals: Vital[];
  hospitalizations: Hospitalization[];
  discharges: Discharge[];
  followUps: FollowUp[];
  notifications: Notification[];
  audit: AuditEntry[];
  addPatient: (p: Omit<Patient, "id" | "created_at" | "created_by">) => Promise<string | null>;
  addVisit: (
    v: Omit<ClinicalVisit, "id" | "visit_date" | "doctor_id">,
    vt?: Partial<Omit<Vital, "id" | "measured_at" | "recorded_by">>
  ) => Promise<string | null>;
  addDischarge: (d: DischargeInput) => Promise<string | null>;
  completeFollowUp: (id: string, notes: string, next: string) => Promise<string | null>;
  setRole: (id: string, role: Role) => Promise<string | null>;
  markNotificationRead: (id: string) => Promise<string | null>;
  deletePatient: (id: string) => Promise<string | null>;
}

const Ctx = createContext<Data | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const notConfigured = !URL || !ANON;

  const supabase = useMemo(() => {
    if (notConfigured) return null;
    return createClient();
  }, [notConfigured]);

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  // Boshlang'ich yuklash
  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      setProfile(prof as Profile | null);

      const [prf, reg, fac, pat, vis, vit, hosp, dis, fu, notif, aud] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("regions").select("*").order("name"),
        supabase.from("facilities").select("*").order("name"),
        supabase.from("patients").select("*").order("created_at", { ascending: false }),
        supabase.from("clinical_visits").select("*").order("visit_date", { ascending: false }),
        supabase.from("vitals").select("*").order("measured_at", { ascending: false }),
        supabase.from("hospitalizations").select("*").order("admission_date", { ascending: false }),
        supabase.from("discharges").select("*").order("discharge_date", { ascending: false }),
        supabase.from("follow_ups").select("*").order("due_date", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
        supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      if (cancelled) return;
      setProfiles((prf.data as Profile[]) ?? []);
      setRegions((reg.data as Region[]) ?? []);
      setFacilities((fac.data as Facility[]) ?? []);
      setPatients((pat.data as Patient[]) ?? []);
      setVisits((vis.data as ClinicalVisit[]) ?? []);
      setVitals((vit.data as Vital[]) ?? []);
      setHospitalizations((hosp.data as Hospitalization[]) ?? []);
      setDischarges((dis.data as Discharge[]) ?? []);
      setFollowUps((fu.data as FollowUp[]) ?? []);
      setNotifications((notif.data as Notification[]) ?? []);
      setAudit((aud.data as AuditEntry[]) ?? []);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  // --- Mutatsiyalar ---
  const addPatient = useCallback(
    async (p: Omit<Patient, "id" | "created_at" | "created_by">): Promise<string | null> => {
      if (!supabase || !profile) return "Tizimga ulanmagan";
      const { data, error } = await supabase
        .from("patients")
        .insert({ ...p, created_by: profile.id })
        .select()
        .single();
      if (error) return error.message;
      setPatients((prev) => [data as Patient, ...prev]);
      return null;
    },
    [supabase, profile]
  );

  const addVisit = useCallback(
    async (
      v: Omit<ClinicalVisit, "id" | "visit_date" | "doctor_id">,
      vt?: Partial<Omit<Vital, "id" | "measured_at" | "recorded_by">>
    ): Promise<string | null> => {
      if (!supabase || !profile) return "Tizimga ulanmagan";
      const { data: visit, error } = await supabase
        .from("clinical_visits")
        .insert({ ...v, doctor_id: profile.id, visit_date: new Date().toISOString() })
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
    [supabase, profile]
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

  const addDischarge = useCallback(
    async (d: DischargeInput): Promise<string | null> => {
      if (!supabase || !profile) return "Tizimga ulanmagan";

      const { data: hosp, error: e1 } = await supabase
        .from("hospitalizations")
        .insert({
          patient_id: d.patientId,
          doctor_id: profile.id,
          admission_date: d.admissionDate,
          diagnosis: d.diagnosis || null,
          status: "discharged",
        })
        .select()
        .single();
      if (e1) return e1.message;
      setHospitalizations((prev) => [hosp as Hospitalization, ...prev]);

      const { data: disc, error: e2 } = await supabase
        .from("discharges")
        .insert({
          hospitalization_id: hosp.id,
          patient_id: d.patientId,
          doctor_id: profile.id,
          discharge_date: d.dischargeDate,
          summary: d.summary || null,
          recommendations: d.recommendations || null,
          requires_follow_up: d.requiresFollowUp,
          follow_up_days: d.requiresFollowUp ? d.followUpDays : null,
          assigned_family_doctor_id: d.familyDoctorId,
        })
        .select()
        .single();
      if (e2) return e2.message;
      setDischarges((prev) => [disc as Discharge, ...prev]);

      // DB trigger follow_up + notification yaratadi — qayta yuklash
      await refreshFollowupsAndNotifications();
      return null;
    },
    [supabase, profile, refreshFollowupsAndNotifications]
  );

  const completeFollowUp = useCallback(
    async (id: string, notes: string, next: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { error } = await supabase
        .from("follow_ups")
        .update({
          status: "completed",
          result_notes: notes || null,
          next_step: next || null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return error.message;
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: "completed", result_notes: notes || null, next_step: next || null, completed_at: new Date().toISOString() }
            : f
        )
      );
      return null;
    },
    [supabase]
  );

  const setRole = useCallback(
    async (id: string, role: Role): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
      if (error) return error.message;
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
      return null;
    },
    [supabase]
  );

  const markNotificationRead = useCallback(
    async (id: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      return null;
    },
    [supabase]
  );

  const deletePatient = useCallback(
    async (id: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) return error.message;
      setPatients((prev) => prev.filter((p) => p.id !== id));
      return null;
    },
    [supabase]
  );

  const value = useMemo<Data>(
    () => ({
      ready,
      notConfigured,
      profile,
      profiles,
      regions,
      facilities,
      patients,
      visits,
      vitals,
      hospitalizations,
      discharges,
      followUps,
      notifications,
      audit,
      addPatient,
      addVisit,
      addDischarge,
      completeFollowUp,
      setRole,
      markNotificationRead,
      deletePatient,
    }),
    [
      ready, notConfigured, profile, profiles, regions, facilities, patients, visits,
      vitals, hospitalizations, discharges, followUps, notifications, audit,
      addPatient, addVisit, addDischarge, completeFollowUp, setRole,
      markNotificationRead, deletePatient,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData DataProvider ichida ishlatilishi kerak");
  return ctx;
}
