import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ageFromBirthDate, formatDate, formatDateTime } from "@/lib/utils";
import { GENDER_LABELS, type TimelineEvent } from "@/lib/types";
import { VisitForm } from "./visit-form";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("*, regions(name)")
    .eq("id", id)
    .single();

  if (!patient) {
    return (
      <div className="card text-center">
        <p className="text-slate-500">Bemor topilmadi.</p>
        <Link href="/dashboard/patients" className="mt-4 inline-block text-teal-600">
          ← Bemorlarga qaytish
        </Link>
      </div>
    );
  }

  const [{ data: visits }, { data: vitals }, { data: hospitalizations }, { data: discharges }, { data: followUps }] =
    await Promise.all([
      supabase
        .from("clinical_visits")
        .select("*, profiles(full_name)")
        .eq("patient_id", id)
        .order("visit_date", { ascending: false }),
      supabase
        .from("vitals")
        .select("*")
        .eq("patient_id", id)
        .order("measured_at", { ascending: false }),
      supabase
        .from("hospitalizations")
        .select("*")
        .eq("patient_id", id)
        .order("admission_date", { ascending: false }),
      supabase
        .from("discharges")
        .select("*")
        .eq("patient_id", id)
        .order("discharge_date", { ascending: false }),
      supabase
        .from("follow_ups")
        .select("*, profiles(full_name)")
        .eq("patient_id", id)
        .order("due_date", { ascending: false }),
    ]);

  // Timeline yig'ish
  const timeline: TimelineEvent[] = [];

  visits?.forEach((v: any) =>
    timeline.push({
      id: v.id,
      type: "visit",
      title: "Klinik tashrif",
      detail: v.chief_complaint || v.diagnosis || "Tashrif qayd etildi",
      date: v.visit_date,
    })
  );

  vitals?.forEach((v: any) =>
    timeline.push({
      id: v.id,
      type: "vital",
      title: "Hayotiy ko'rsatkichlar",
      detail: formatVitals(v),
      date: v.measured_at,
    })
  );

  hospitalizations?.forEach((h: any) =>
    timeline.push({
      id: h.id,
      type: "hospitalization",
      title: "Statsionarga yotqizish",
      detail: h.diagnosis || "Davolanish boshlandi",
      date: h.admission_date,
    })
  );

  discharges?.forEach((d: any) =>
    timeline.push({
      id: d.id,
      type: "discharge",
      title: "Chiqarish",
      detail: d.requires_follow_up
        ? `Kuzatuv kerak (${d.follow_up_days ?? 7} kun)`
        : "Kuzatuv talab qilinmaydi",
      date: d.discharge_date,
    })
  );

  followUps?.forEach((f: any) =>
    timeline.push({
      id: f.id,
      type: "follow_up",
      title: "Kuzatuv (follow-up)",
      detail: f.result_notes || f.status,
      date: f.due_date,
    })
  );

  timeline.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/patients" className="text-sm text-teal-600 hover:text-teal-700">
          ← Bemorlarga qaytish
        </Link>
      </div>

      {/* Bemor profili */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700">
              {patient.full_name.charAt(0)}
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
              <p className="text-sm text-slate-500">
                {ageFromBirthDate(patient.birth_date)}
                {patient.gender ? ` · ${GENDER_LABELS[patient.gender]}` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="#visit" className="btn-primary">
              + Tashrif qayd etish
            </a>
            <Link href={`/dashboard/discharges/new?patient=${id}`} className="btn-secondary">
              🏥 Chiqarish
            </Link>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <InfoItem label="JSHSHIR" value={patient.pinfl} />
          <InfoItem label="Hudud" value={patient.regions?.name} />
          <InfoItem label="Telefon" value={patient.phone} />
          <InfoItem label="Manzil" value={patient.address} />
          <InfoItem label="Favqulodda aloqa" value={patient.emergency_contact} />
          <InfoItem label="Ro'yxatga olingan" value={formatDate(patient.created_at)} />
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline */}
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Tibbiy timeline</h2>
          {timeline.length > 0 ? (
            <ol className="relative space-y-5 border-l-2 border-slate-200 pl-5">
              {timeline.map((e) => (
                <li key={`${e.type}-${e.id}`} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${iconColor(e.type)}`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{e.title}</p>
                      <p className="text-sm text-slate-600">{e.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDateTime(e.date)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-500">
              Hozircha ma&lsquo;lumot yo&lsquo;q. Tashrif qayd etib boshlang.
            </p>
          )}
        </div>

        {/* Tashrif formasi */}
        <div id="visit" className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Yangi klinik tashrif</h2>
          <VisitForm patientId={id} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{value ?? "—"}</dd>
    </div>
  );
}

function formatVitals(v: any): string {
  const parts: string[] = [];
  if (v.bp_sys && v.bp_dia) parts.push(`AB ${v.bp_sys}/${v.bp_dia}`);
  if (v.heart_rate) parts.push(`Puls ${v.heart_rate}`);
  if (v.temperature) parts.push(`T ${v.temperature}°`);
  if (v.spo2) parts.push(`SpO₂ ${v.spo2}%`);
  if (v.weight) parts.push(`Vazn ${v.weight}kg`);
  return parts.join(" · ") || "Ko'rsatkichlar";
}

function iconColor(type: string): string {
  const map: Record<string, string> = {
    visit: "bg-teal-500",
    vital: "bg-blue-500",
    hospitalization: "bg-purple-500",
    discharge: "bg-amber-500",
    follow_up: "bg-green-500",
  };
  return map[type] ?? "bg-slate-400";
}
