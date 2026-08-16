import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ageFromBirthDate, formatDate } from "@/lib/utils";
import { GENDER_LABELS, type Patient } from "@/lib/types";

export default async function PatientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patients } = await supabase
    .from("patients")
    .select("*, regions(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bemorlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Jami {patients?.length ?? 0} ta bemor ro&lsquo;yxatda
          </p>
        </div>
        <Link href="/dashboard/patients/new" className="btn-primary">
          + Yangi bemor
        </Link>
      </div>

      {patients && patients.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Bemor</th>
                <th className="px-4 py-3 font-medium">JSHSHIR</th>
                <th className="px-4 py-3 font-medium">Yosh</th>
                <th className="px-4 py-3 font-medium">Hudud</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Qo&lsquo;shilgan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p: Patient & { regions?: { name: string } | null }) => (
                <tr key={p.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/patients/${p.id}`} className="font-medium text-teal-600 hover:text-teal-700">
                      {p.full_name}
                    </Link>
                    {p.gender && (
                      <span className="ml-2 text-xs text-slate-400">{GENDER_LABELS[p.gender]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.pinfl ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{ageFromBirthDate(p.birth_date)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.regions?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-slate-500">Hozircha bemorlar yo&lsquo;q.</p>
          <Link href="/dashboard/patients/new" className="btn-primary mt-4 inline-flex">
            + Birinchi bemorni qo&lsquo;shish
          </Link>
        </div>
      )}
    </div>
  );
}
