import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareLink — Tibbiy kuzatuv platformasi",
  description:
    "Bemorning smartfoni yoki interneti bo'lmasa ham, tibbiy ma'lumotlarini raqamlashtiradigan va statsionardan uyga chiqqan bemorni avtomatik keyingi kuzatuvga ulaydigan platforma.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AppRouterCacheProvider>
          {children}
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}