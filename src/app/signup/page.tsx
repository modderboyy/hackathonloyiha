import Link from "next/link";
import { signupAction } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-xl font-bold text-white">
              C
            </span>
            <span className="text-xl font-bold text-slate-900">CareLink</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Ro&lsquo;yxatdan o&lsquo;tish</h1>
          <p className="mt-1 text-sm text-slate-500">
            Yangi hisob yarating (rol admin tomonidan tayinlanadi)
          </p>
        </div>

        <div className="card">
          <SignupForm action={signupAction} />

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700">
              Kirish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
