"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type {
  Patient,
  ClinicalVisit,
  Vital,
  Discharge,
  FollowUp,
  Notification,
  Profile,
  Role,
  Hospitalization,
  AuditEntry,
  Region,
  Facility,
} from "./types";
import * as M from "./mock";

export const CURRENT_USER: Profile = M.PROFILES[0]; // super_admin (demo)

interface Store {
  regions: Region[];
  facilities: Facility[];
  profiles: Profile[];
  patients: Patient[];
  visits: ClinicalVisit[];
  vitals: Vital[];
  hospitalizations: Hospitalization[];
  discharges: Discharge[];
  followUps: FollowUp[];
  notifications: Notification[];
  audit: AuditEntry[];
  currentUser: Profile;
  addPatient: (p: Omit<Patient, "id" | "created_at">) => Patient;
  addVisit: (v: Omit<ClinicalVisit, "id" | "visit_date">, vitals?: Partial<Omit<Vital, "id" | "measured_at">>) => void;
  addDischarge: (d: {
    patientId: string;
    admissionDate: string;
    dischargeDate: string;
    diagnosis: string;
    summary: string;
    recommendations: string;
    requiresFollowUp: boolean;
    followUpDays: number;
    familyDoctorId: string | null;
  }) => void;
  completeFollowUp: (id: string, resultNotes: string, nextStep: string) => void;
  setRole: (profileId: string, role: Role) => void;
  markNotificationRead: (id: string) => void;
  deletePatient: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

let idCounter = 1000;
const uid = (prefix: string) => `${prefix}-${++idCounter}`;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [regions] = useState<Region[]>(M.REGIONS);
  const [facilities] = useState<Facility[]>(M.FACILITIES);
  const [profiles, setProfiles] = useState<Profile[]>(M.PROFILES);
  const [patients, setPatients] = useState<Patient[]>(M.PATIENTS);
  const [visits, setVisits] = useState<ClinicalVisit[]>(M.VISITS);
  const [vitals, setVitals] = useState<Vital[]>(M.VITALS);
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>(M.HOSPITALIZATIONS);
  const [discharges, setDischarges] = useState<Discharge[]>(M.DISCHARGES);
  const [followUps, setFollowUps] = useState<FollowUp[]>(M.FOLLOWUPS);
  const [notifications, setNotifications] = useState<Notification[]>(M.NOTIFICATIONS);
  const [audit, setAudit] = useState<AuditEntry[]>(M.AUDIT);

  const addPatient = useCallback((p: Omit<Patient, "id" | "created_at">) => {
    const np: Patient = { ...p, id: uid("p"), created_at: new Date().toISOString() };
    setPatients((prev) => [np, ...prev]);
    setAudit((prev) => [
      { id: ++idCounter, user_id: CURRENT_USER.id, action: "INSERT", entity: "patients", entity_id: np.id, created_at: new Date().toISOString() },
      ...prev,
    ]);
    return np;
  }, []);

  const addVisit = useCallback(
    (v: Omit<ClinicalVisit, "id" | "visit_date">, vt?: Partial<Omit<Vital, "id" | "measured_at">>) => {
      const nv: ClinicalVisit = { ...v, id: uid("v"), visit_date: new Date().toISOString() };
      setVisits((prev) => [nv, ...prev]);
      if (vt && Object.values(vt).some((x) => x)) {
        const nvt: Vital = { id: uid("vt"), patient_id: v.patient_id, bp_sys: null, bp_dia: null, heart_rate: null, temperature: null, spo2: null, weight: null, ...vt, measured_at: new Date().toISOString() };
        setVitals((prev) => [nvt, ...prev]);
      }
      setAudit((prev) => [
        { id: ++idCounter, user_id: CURRENT_USER.id, action: "INSERT", entity: "clinical_visits", entity_id: nv.id, created_at: new Date().toISOString() },
        ...prev,
      ]);
    },
    []
  );

  const addDischarge = useCallback(
    (d: {
      patientId: string;
      admissionDate: string;
      dischargeDate: string;
      diagnosis: string;
      summary: string;
      recommendations: string;
      requiresFollowUp: boolean;
      followUpDays: number;
      familyDoctorId: string | null;
    }) => {
      const hospId = uid("h");
      setHospitalizations((prev) => [
        { id: hospId, patient_id: d.patientId, facility_id: "f-1", doctor_id: CURRENT_USER.id, admission_date: d.admissionDate, diagnosis: d.diagnosis || null, status: "discharged" },
        ...prev,
      ]);

      const discId = uid("d");
      // hudud bo'yicha oilaviy shifokorni avtomatik topish (trigger mantig'i)
      const patient = patients.find((p) => p.id === d.patientId);
      let famDoc = d.familyDoctorId;
      if (!famDoc && patient?.region_id) {
        famDoc = profiles.find((pr) => pr.role === "family_doctor" && pr.region_id === patient.region_id)?.id ?? null;
      }

      const nd: Discharge = {
        id: discId,
        hospitalization_id: hospId,
        patient_id: d.patientId,
        doctor_id: CURRENT_USER.id,
        discharge_date: d.dischargeDate,
        summary: d.summary || null,
        recommendations: d.recommendations || null,
        requires_follow_up: d.requiresFollowUp,
        follow_up_days: d.requiresFollowUp ? d.followUpDays : null,
        assigned_family_doctor_id: famDoc,
      };
      setDischarges((prev) => [nd, ...prev]);

      if (d.requiresFollowUp && famDoc) {
        const due = new Date(d.dischargeDate);
        due.setDate(due.getDate() + d.followUpDays);
        setFollowUps((prev) => [
          {
            id: uid("fu"),
            patient_id: d.patientId,
            discharge_id: discId,
            family_doctor_id: famDoc,
            due_date: due.toISOString().slice(0, 10),
            status: "pending",
            result_notes: null,
            next_step: null,
            completed_at: null,
          },
          ...prev,
        ]);
        setNotifications((prev) => [
          {
            id: uid("n"),
            recipient_id: famDoc,
            type: "follow_up",
            title: "Yangi kuzatuv so'rovi",
            body: `Bemor ${patient?.full_name ?? "noma'lum"} statsionardan chiqarildi va ${d.followUpDays} kunlik kuzatuvga muhtoj.`,
            patient_id: d.patientId,
            is_read: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      setAudit((prev) => [
        { id: ++idCounter, user_id: CURRENT_USER.id, action: "INSERT", entity: "discharges", entity_id: discId, created_at: new Date().toISOString() },
        ...prev,
      ]);
    },
    [patients, profiles]
  );

  const completeFollowUp = useCallback((id: string, resultNotes: string, nextStep: string) => {
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: "completed", result_notes: resultNotes || null, next_step: nextStep || null, completed_at: new Date().toISOString() }
          : f
      )
    );
    setAudit((prev) => [
      { id: ++idCounter, user_id: CURRENT_USER.id, action: "UPDATE", entity: "follow_ups", entity_id: id, created_at: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const setRole = useCallback((profileId: string, role: Role) => {
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role } : p)));
    setAudit((prev) => [
      { id: ++idCounter, user_id: CURRENT_USER.id, action: "UPDATE", entity: "profiles", entity_id: profileId, created_at: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setAudit((prev) => [
      { id: ++idCounter, user_id: CURRENT_USER.id, action: "DELETE", entity: "patients", entity_id: id, created_at: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const value = useMemo<Store>(
    () => ({
      regions,
      facilities,
      profiles,
      patients,
      visits,
      vitals,
      hospitalizations,
      discharges,
      followUps,
      notifications,
      audit,
      currentUser: CURRENT_USER,
      addPatient,
      addVisit,
      addDischarge,
      completeFollowUp,
      setRole,
      markNotificationRead,
      deletePatient,
    }),
    [regions, facilities, profiles, patients, visits, vitals, hospitalizations, discharges, followUps, notifications, audit, addPatient, addVisit, addDischarge, completeFollowUp, setRole, markNotificationRead, deletePatient]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore StoreProvider ichida ishlatilishi kerak");
  return ctx;
}
