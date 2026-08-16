import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createDischargeAction } from "@/lib/actions/discharge";
import { DischargeForm } from "./discharge-form";
import type { Patient, Profile } from "@/lib/types";

export default async function NewDischargePage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const { patient } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: patients }, { data: familyDoctors }] = await Promise.all([
    supabase.from("patients").select("*").order("full_name"),
    supabase.from("profiles").select("*").eq("role", "family_doctor").order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/discharges" className="text-sm text-teal-600 hover:text-teal-700">
          ← Chiqarishlarga qaytish
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Statsionardan chiqarish va yo&lsquo;naltirish
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Chiqarishdan so&lsquo;ng CareLink avtomatik ravishda hududiy oilaviy shifokorga
          xabarnoma yaratadi va follow-up kuzatuvini ochadi.
        </p>
      </div>

      <div className="card max-w-2xl">
        <DischargeForm
          action={createDischargeAction}
          patients={(patients as Patient[]) ?? []}
          familyDoctors={(familyDoctors as Profile[]) ?? []}
          preselectedPatient={patient}
        />
      </div>
    </div>
  );
}
