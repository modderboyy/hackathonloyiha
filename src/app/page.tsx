import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-lg font-bold text-white">
              C
            </span>
            <span className="text-lg font-bold text-slate-900">CareLink</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary">
              Kirish
            </Link>
            <Link href="/signup" className="btn-primary">
              Ro&lsquo;yxatdan o&lsquo;tish
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
              Raqamli tibbiy kuzatuv platformasi
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Bemor smartfoni yoki interneti{" "}
              <span className="text-teal-600">bo&lsquo;lmasa ham</span>, tibbiy
              ma&lsquo;lumotlari yo&lsquo;qolmaydi.
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              CareLink bemorning tibbiy ma&lsquo;lumotlarini tibbiyot xodimi
              orqali raqamlashtiradi va statsionardan uyga chiqqan bemorni
              avtomatik ravishda hududiy oilaviy shifokor kuzatuviga ulaydi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">
                Boshlash
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                Tizimga kirish
              </Link>
            </div>
          </div>

          {/* Vizual karta */}
          <div className="space-y-4">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Kasalxona → CareLink → Oilaviy shifokor
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Step n={1} label="Discharge" desc="Statsionar shifokori chiqarish ma'lumotlarini kiritadi" />
                <Arrow />
                <Step n={2} label="Xabarnoma" desc="Hududiy shifokorga avtomatik bildirishnoma" />
                <Arrow />
                <Step n={3} label="Follow-up" desc="Kuzatuv rejasi va natijalar qayd qilinadi" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Minimal raqamli talab" value="0%" />
              <Stat label="Care journey uzluksiz" value="100%" />
              <Stat label="Ma'lumot yo'qolishi" value="0" />
            </div>
          </div>
        </div>

        {/* Xususiyatlar */}
        <div className="mt-24 grid gap-6 md:grid-cols-3">
          <Feature
            title="Digital intake"
            desc="Shikoyatlar, ko'rsatkichlar va tashrif ma'lumotlarini xodim orqali kiritish."
          />
          <Feature
            title="Discharge coordination"
            desc="Statsionardan chiqarish va keyingi kuzatuvni bir jarayonga birlashtirish."
          />
          <Feature
            title="Family doctor follow-up"
            desc="Bemorni hududiy oilaviy shifokorga avtomatik yo'naltirish va kuzatish."
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-slate-500">
          CareLink — mavjud sog&lsquo;liqni saqlash tizimlari ustida ishlovchi
          care-coordination layer.
        </div>
      </footer>
    </div>
  );
}

function Step({ n, label, desc }: { n: number; label: string; desc: string }) {
  return (
    <div className="flex-1">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
        {n}
      </span>
      <p className="mt-2 text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function Arrow() {
  return <span className="text-slate-300">→</span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <p className="text-3xl font-bold text-teal-600">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}
