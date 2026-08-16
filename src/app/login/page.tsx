import Link from "next/link";
import { loginAction } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Tizimga kirish</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tibbiyot xodimlari uchun boshqaruv paneli
          </p>
        </div>

        <div className="card">
          <LoginForm action={loginAction} />

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
            Hisobingiz yo&lsquo;qmi?{" "}
            <Link href="/signup" className="font-medium text-teal-600 hover:text-teal-700">
              Ro&lsquo;yxatdan o&lsquo;ting
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
