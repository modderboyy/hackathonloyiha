import Link from "next/link";
import { loginAction } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size={40} withText />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Tizimga kirish</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tibbiyot xodimlari uchun boshqaruv paneli
          </p>
        </div>

        <div className="card">
          <LoginForm action={loginAction} />

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
            Hisobingiz yo&lsquo;qmi?{" "}
            <Link href="/signup" className="font-medium text-primary-700 hover:text-primary-800">
              Ro&lsquo;yxatdan o&lsquo;ting
            </Link>
          </div>

          <div className="mt-3 rounded-lg bg-primary-50 p-3 text-center">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Demo rejimda ko&lsquo;rish →
            </Link>
            <p className="mt-0.5 text-xs text-slate-400">Supabase sozlanmagan bo&lsquo;lsa ham ishlaydi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
