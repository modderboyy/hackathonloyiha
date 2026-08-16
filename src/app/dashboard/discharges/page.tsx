import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { Discharge } from "@/lib/types";

export default async function DischargesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: discharges } = await supabase
    .from("discharges")
    .select("*, patients(full_name), profiles!discharges_assigned_family_doctor_id_fkey(full_name)")
    .order("discharge_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chiqarishlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Statsionardan chiqarilgan bemorlar va yo&lsquo;naltirishlar
          </p>
        </div>
        <Link href="/dashboard/discharges/new" className="btn-primary">
          + Yangi chiqarish
        </Link>
      </div>

      {discharges && discharges.length > 0 ? (
        <div className="space-y-3">
          {discharges.map((d: any) => (
            <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{d.patients?.full_name}</p>
                <p className="text-sm text-slate-500">
                  Chiqarilgan: {formatDate(d.discharge_date)}
                  {d.assigned_family_doctor_id
                    ? ` · Shifokor: ${d.profiles?.full_name ?? "Tayinlangan"}`
                    : ""}
                </p>
                {d.summary && <p className="mt-1 text-sm text-slate-600 line-clamp-1">{d.summary}</p>}
              </div>
              <div className="flex items-center gap-3">
                {d.requires_follow_up ? (
                  <span className="badge bg-teal-100 text-teal-700">
                    Kuzatuv kerak ({d.follow_up_days ?? 7} kun)
                  </span>
                ) : (
                  <span className="badge bg-slate-100 text-slate-600">Kuzatuvsiz</span>
                )}
                <Link href={`/dashboard/patients/${d.patient_id}`} className="text-sm font-medium text-teal-600 hover:text-teal-700">
                  Bemor →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-slate-500">Hozircha chiqarishlar yo&lsquo;q.</p>
          <Link href="/dashboard/discharges/new" className="btn-primary mt-4 inline-flex">
            + Birinchi chiqarishni yaratish
          </Link>
        </div>
      )}
    </div>
  );
}
