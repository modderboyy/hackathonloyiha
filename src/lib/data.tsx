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
  Approval,
  AuditEntry,
  Building,
  ClinicalVisit,
  Discharge,
  District,
  Facility,
  FollowUp,
  Hospitalization,
  Neighborhood,
  Notification,
  Patient,
  Profile,
  Region,
  Role,
  Street,
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
  districts: District[];
  neighborhoods: Neighborhood[];
  streets: Street[];
  buildings: Building[];
  facilities: Facility[];
  patients: Patient[];
  visits: ClinicalVisit[];
  vitals: Vital[];
  hospitalizations: Hospitalization[];
  discharges: Discharge[];
  followUps: FollowUp[];
  notifications: Notification[];
  audit: AuditEntry[];
  approvals: Approval[];

  // bemor/tibbiy
  addPatient: (p: Omit<Patient, "id" | "created_at" | "created_by">) => Promise<string | null>;
  addVisit: (
    v: Omit<ClinicalVisit, "id" | "visit_date" | "doctor_id">,
    vt?: Partial<Omit<Vital, "id" | "measured_at" | "recorded_by">>
  ) => Promise<string | null>;
  addDischarge: (d: DischargeInput) => Promise<string | null>;
  completeFollowUp: (id: string, notes: string, next: string) => Promise<string | null>;
  markNotificationRead: (id: string) => Promise<string | null>;
  deletePatient: (id: string) => Promise<string | null>;

  // hududlar
  addRegion: (name: string, code: string) => Promise<string | null>;
  addDistrict: (name: string, regionId: string) => Promise<string | null>;
  addNeighborhood: (name: string, districtId: string) => Promise<string | null>;
  addStreet: (name: string, neighborhoodId: string) => Promise<string | null>;
  addBuilding: (number: string, name: string, streetId: string) => Promise<string | null>;
  deleteDistrict: (id: string) => Promise<string | null>;

  // adminlar
  setRole: (id: string, role: Role, scope?: { region_id?: string | null; district_id?: string | null }) => Promise<string | null>;

  // approval
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

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);

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

      const [
        prf, reg, dist, nbh, str, bld, fac, pat, vis, vit, hosp, dis, fu, notif, aud, appr,
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("regions").select("*").order("name"),
        supabase.from("districts").select("*").order("name"),
        supabase.from("neighborhoods").select("*").order("name"),
        supabase.from("streets").select("*").order("name"),
        supabase.from("buildings").select("*").order("number"),
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
      ]);

      if (cancelled) return;
      setProfiles((prf.data as Profile[]) ?? []);
      setRegions((reg.data as Region[]) ?? []);
      setDistricts((dist.data as District[]) ?? []);
      setNeighborhoods((nbh.data as Neighborhood[]) ?? []);
      setStreets((str.data as Street[]) ?? []);
      setBuildings((bld.data as Building[]) ?? []);
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
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  // --- Bemor / tibbiy mutatsiyalar ---
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
        .insert({ patient_id: d.patientId, doctor_id: profile.id, admission_date: d.admissionDate, diagnosis: d.diagnosis || null, status: "discharged" })
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
        .update({ status: "completed", result_notes: notes || null, next_step: next || null, completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return error.message;
      setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status: "completed", result_notes: notes || null, next_step: next || null, completed_at: new Date().toISOString() } : f)));
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

  // --- Hudud mutatsiyalari ---
  const addRegion = useCallback(
    async (name: string, code: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { data, error } = await supabase.from("regions").insert({ name, code }).select().single();
      if (error) return error.message;
      setRegions((prev) => [...prev, data as Region]);
      return null;
    },
    [supabase]
  );

  const addDistrict = useCallback(
    async (name: string, regionId: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { data, error } = await supabase.from("districts").insert({ name, region_id: regionId }).select().single();
      if (error) return error.message;
      setDistricts((prev) => [...prev, data as District]);
      return null;
    },
    [supabase]
  );

  const addNeighborhood = useCallback(
    async (name: string, districtId: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { data, error } = await supabase.from("neighborhoods").insert({ name, district_id: districtId }).select().single();
      if (error) return error.message;
      setNeighborhoods((prev) => [...prev, data as Neighborhood]);
      return null;
    },
    [supabase]
  );

  const addStreet = useCallback(
    async (name: string, neighborhoodId: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { data, error } = await supabase.from("streets").insert({ name, neighborhood_id: neighborhoodId }).select().single();
      if (error) return error.message;
      setStreets((prev) => [...prev, data as Street]);
      return null;
    },
    [supabase]
  );

  const addBuilding = useCallback(
    async (number: string, name: string, streetId: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { data, error } = await supabase
        .from("buildings")
        .insert({ number, name: name || null, street_id: streetId })
        .select()
        .single();
      if (error) return error.message;
      setBuildings((prev) => [...prev, data as Building]);
      return null;
    },
    [supabase]
  );

  const deleteDistrict = useCallback(
    async (id: string): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const { error } = await supabase.from("districts").delete().eq("id", id);
      if (error) return error.message;
      setDistricts((prev) => prev.filter((d) => d.id !== id));
      return null;
    },
    [supabase]
  );

  // --- Admin / rol ---
  const setRole = useCallback(
    async (id: string, role: Role, scope?: { region_id?: string | null; district_id?: string | null }): Promise<string | null> => {
      if (!supabase) return "Tizimga ulanmagan";
      const patch: Record<string, unknown> = { role };
      if (scope) {
        if ("region_id" in scope) patch.region_id = scope.region_id ?? null;
        if ("district_id" in scope) patch.district_id = scope.district_id ?? null;
      }
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) return error.message;
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...(patch as Partial<Profile>) } : p)));
      return null;
    },
    [supabase]
  );

  // --- Approval ---
  const submitApproval = useCallback(
    async (a: { type: Approval["type"]; title: string; payload: Record<string, unknown>; district_id?: string | null; region_id?: string | null }): Promise<string | null> => {
      if (!supabase || !profile) return "Tizimga ulanmagan";
      const { data, error } = await supabase
        .from("approvals")
        .insert({
          type: a.type,
          title: a.title,
          payload: a.payload,
          district_id: a.district_id ?? null,
          region_id: a.region_id ?? null,
          submitted_by: profile.id,
          status: "pending_region",
        })
        .select()
        .single();
      if (error) return error.message;
      setApprovals((prev) => [data as Approval, ...prev]);
      return null;
    },
    [supabase, profile]
  );

  const decideApproval = useCallback(
    async (id: string, level: "region" | "republic", decision: "approve" | "reject"): Promise<string | null> => {
      if (!supabase || !profile) return "Tizimga ulanmagan";
      if (level === "region") {
        const patch: Record<string, unknown> = {
          region_decision: decision,
          region_decided_by: profile.id,
          region_decided_at: new Date().toISOString(),
          status: decision === "approve" ? "approved" : "pending_republic",
        };
        const { error } = await supabase.from("approvals").update(patch).eq("id", id);
        if (error) return error.message;
        setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, ...(patch as Partial<Approval>) } : a)));
      } else {
        const patch: Record<string, unknown> = {
          republic_decision: decision,
          republic_decided_by: profile.id,
          republic_decided_at: new Date().toISOString(),
          status: decision === "approve" ? "approved" : "rejected",
        };
        const { error } = await supabase.from("approvals").update(patch).eq("id", id);
        if (error) return error.message;
        setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, ...(patch as Partial<Approval>) } : a)));
      }
      return null;
    },
    [supabase, profile]
  );

  const value = useMemo<Data>(
    () => ({
      ready, notConfigured, profile, profiles, regions, districts, neighborhoods,
      streets, buildings, facilities, patients, visits, vitals, hospitalizations,
      discharges, followUps, notifications, audit, approvals,
      addPatient, addVisit, addDischarge, completeFollowUp, markNotificationRead,
      deletePatient, addRegion, addDistrict, addNeighborhood, addStreet, addBuilding,
      deleteDistrict, setRole, submitApproval, decideApproval,
    }),
    [
      ready, notConfigured, profile, profiles, regions, districts, neighborhoods,
      streets, buildings, facilities, patients, visits, vitals, hospitalizations,
      discharges, followUps, notifications, audit, approvals,
      addPatient, addVisit, addDischarge, completeFollowUp, markNotificationRead,
      deletePatient, addRegion, addDistrict, addNeighborhood, addStreet, addBuilding,
      deleteDistrict, setRole, submitApproval, decideApproval,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData DataProvider ichida ishlatilishi kerak");
  return ctx;
}
