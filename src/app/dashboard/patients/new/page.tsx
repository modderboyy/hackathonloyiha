import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createPatientAction } from "@/lib/actions/patients";
import { PatientForm } from "./patient-form";
import type { Region } from "@/lib/types";

export default async function NewPatientPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: regions } = await supabase
    .from("regions")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/patients" className="text-sm text-teal-600 hover:text-teal-700">
          ← Bemorlarga qaytish
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Yangi bemor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bemor smartfon yoki internetga ega bo&lsquo;lmasa ham profil yaratiladi.
        </p>
      </div>

      <div className="card max-w-2xl">
        <PatientForm action={createPatientAction} regions={(regions as Region[]) ?? []} />
      </div>
    </div>
  );
}
