"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useData } from "@/lib/data";
import { Input, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { ssr: false });

type Level = "regions" | "districts" | "neighborhoods" | "streets" | "buildings";

export function Points() {
  const { regions, districts, neighborhoods, streets, buildings, profile } = useData();
  const [regionId, setRegionId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);
  const [streetId, setStreetId] = useState<string | null>(null);

  const canEdit = profile?.role === "super_admin" || profile?.role === "admin" || profile?.role === "district_admin";

  const level: Level = !regionId ? "regions" : !districtId ? "districts" : !neighborhoodId ? "neighborhoods" : !streetId ? "streets" : "buildings";

  const region = regions.find((r) => r.id === regionId);
  const district = districts.find((d) => d.id === districtId);
  const neighborhood = neighborhoods.find((n) => n.id === neighborhoodId);
  const street = streets.find((s) => s.id === streetId);

  const breadcrumb = useMemo(() => {
    const parts: { label: string; onClick: () => void }[] = [
      { label: "Viloyatlar", onClick: () => { setRegionId(null); setDistrictId(null); setNeighborhoodId(null); setStreetId(null); } },
    ];
    if (region) parts.push({ label: region.name, onClick: () => { setDistrictId(null); setNeighborhoodId(null); setStreetId(null); } });
    if (district) parts.push({ label: district.name, onClick: () => { setNeighborhoodId(null); setStreetId(null); } });
    if (neighborhood) parts.push({ label: neighborhood.name, onClick: () => setStreetId(null) });
    if (street) parts.push({ label: street.name, onClick: () => {} });
    return parts;
  }, [region, district, neighborhood, street]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Punktlar (Manzillar)</h1>
          <p className="text-sm text-slate-500">Viloyat → Tuman → Mahalla → Ko'cha → Bino</p>
        </div>
        {!canEdit && <Badge className="bg-slate-100 text-slate-600">Faqat ko'rish</Badge>}
      </div>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <Icon name="chevron-right" size={14} className="text-slate-400" />}
            <button onClick={b.onClick} className={cn("font-medium", i === breadcrumb.length - 1 ? "text-slate-900" : "text-primary-700 hover:underline")}>
              {b.label}
            </button>
          </span>
        ))}
      </div>

      {level === "regions" && <RegionsTable onOpen={(id) => setRegionId(id)} />}
      {level === "districts" && regionId && <DistrictsTable regionId={regionId} onOpen={(id) => setDistrictId(id)} />}
      {level === "neighborhoods" && districtId && <NeighborhoodsTable districtId={districtId} onOpen={(id) => setNeighborhoodId(id)} />}
      {level === "streets" && neighborhoodId && <StreetsTable neighborhoodId={neighborhoodId} onOpen={(id) => setStreetId(id)} />}
      {level === "buildings" && streetId && <BuildingsTable streetId={streetId} />}
    </div>
  );
}

// --- Inline tahrirlanadigan katak (autosave) ---
function EditableCell({
  value,
  onSave,
  placeholder,
  className = "",
  disabled,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  function commit() {
    setEditing(false);
    if (val !== value) onSave(val);
  }

  if (editing && !disabled) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setVal(value); setEditing(false); }
        }}
        className={cn("field py-1", className)}
      />
    );
  }
  return (
    <button
      onClick={() => !disabled && setEditing(true)}
      className={cn("group flex items-center gap-1.5 rounded px-1 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100", className)}
      title={disabled ? "" : "Tahrirlash uchun bosing"}
    >
      {value || <span className="text-slate-400">{placeholder ?? "—"}</span>}
      {!disabled && <Icon name="edit" size={12} className="opacity-0 transition group-hover:opacity-100" />}
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={() => { if (confirm("O'chirishni tasdiqlaysizmi?")) onClick(); }}
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      aria-label="O'chirish"
    >
      <Icon name="trash" size={15} />
    </button>
  );
}

function AddRow({ onAdd, placeholder, twoFields }: { onAdd: (a: string, b: string) => Promise<string | null>; placeholder: string; twoFields?: boolean }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!a.trim()) return;
    setBusy(true);
    setErr("");
    const error = await onAdd(a.trim(), b.trim());
    setBusy(false);
    if (error) setErr(error);
    else { setA(""); setB(""); setOpen(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 transition hover:border-primary-400 hover:text-primary-700">
        <Icon name="plus" size={15} /> Qo'shish
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-primary-200 bg-primary-50/50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input autoFocus value={a} onChange={(e) => setA(e.target.value)} placeholder={placeholder} />
        {twoFields && <Input value={b} onChange={(e) => setB(e.target.value)} placeholder="Nomi (ixtiyoriy)" />}
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{busy ? "..." : "Saqlash"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-3 py-1.5 text-xs">Bekor</button>
      </div>
    </form>
  );
}

// =====================================================================
// VILOYATLAR
// =====================================================================
function RegionsTable({ onOpen }: { onOpen: (id: string) => void }) {
  const { regions, districts, addRegion } = useData();
  const distCount = (regionId: string) => districts.filter((d) => d.region_id === regionId).length;

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Nomi</th>
              <th className="px-4 py-3 font-medium">Kod</th>
              <th className="px-4 py-3 font-medium">Tumanlar</th>
              <th className="px-4 py-3 font-medium text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {regions.map((r) => (
              <tr key={r.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <button onClick={() => onOpen(r.id)} className="font-medium text-primary-700 hover:underline">
                    {r.name}
                  </button>
                </td>
                <td className="px-4 py-2.5"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">{r.code}</span></td>
                <td className="px-4 py-2.5 text-slate-600">{distCount(r.id)}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => onOpen(r.id)} className="mr-1 rounded-lg p-1.5 text-primary-700 hover:bg-primary-50" aria-label="Ochish"><Icon name="arrow-right" size={15} /></button>
                  <DeleteBtn onClick={() => {}} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 p-3">
        <AddRow onAdd={async (name) => { const code = name.replace(/\s/g, "").slice(0, 4).toUpperCase() + Math.floor(Math.random() * 90 + 10); return addRegion(name, code); }} placeholder="Viloyat nomi" />
      </div>
    </div>
  );
}

// =====================================================================
// TUMANLAR (joylashuv tanlash bilan)
// =====================================================================
function DistrictsTable({ regionId, onOpen }: { regionId: string; onOpen: (id: string) => void }) {
  const { districts, neighborhoods, addDistrict, updateDistrict, deleteDistrict } = useData();
  const myDistricts = districts.filter((d) => d.region_id === regionId);
  const nbhCount = (id: string) => neighborhoods.filter((n) => n.district_id === id).length;
  const [locFor, setLocFor] = useState<string | null>(null);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [poly, setPoly] = useState<{ lat: number; lng: number }[] | null>(null);

  function openLocation(d: { id: string; lat: number | null; lng: number | null; polygon?: {lat: number; lng: number}[] | null }) {
    setLocFor(d.id);
    setLoc(d.lat !== null && d.lng !== null ? { lat: d.lat, lng: d.lng } : null);
    setPoly(d.polygon || null);
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Nomi</th>
                <th className="px-4 py-3 font-medium">Joylashuv</th>
                <th className="px-4 py-3 font-medium">Mahallalar</th>
                <th className="px-4 py-3 font-medium">Bemorlar</th>
                <th className="px-4 py-3 font-medium text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myDistricts.map((d) => (
                <tr key={d.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <button onClick={() => onOpen(d.id)} className="font-medium text-primary-700 hover:underline">
                      {d.name}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => openLocation(d)} className={cn("flex items-center gap-1 text-xs", d.lat !== null ? "text-emerald-600" : "text-slate-400")}>
                      <Icon name="map-pin" size={13} />
                      {d.lat !== null && d.lng !== null ? `${d.lat.toFixed(3)}, ${d.lng.toFixed(3)}` : "Belgilanmagan"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{nbhCount(d.id)}</td>
                  <td className="px-4 py-2.5 text-slate-600">0</td>
                  <td className="px-4 py-2.5 text-right"><DeleteBtn onClick={() => deleteDistrict(d.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-3">
          <AddRow onAdd={async (name) => addDistrict(name, regionId)} placeholder="Tuman nomi" />
        </div>
      </div>

      {/* Joylashuv tanlash paneli */}
      {locFor && (
        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Joylashuvni belgilash</h3>
            <button onClick={() => setLocFor(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Icon name="close" size={16} /></button>
          </div>
          <LocationPicker
            value={loc}
            polygon={poly}
            onChange={(lat, lng, p) => { setLoc(lat && lng ? {lat, lng} : null); setPoly(p); }}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setLocFor(null)} className="btn-ghost">Bekor</button>
            <button
              onClick={async () => { if (locFor) await updateDistrict(locFor, { lat: loc?.lat ?? null, lng: loc?.lng ?? null, polygon: poly }); setLocFor(null); }}
              className="btn-primary"
            >
              Saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// MAHALLALAR
// =====================================================================
function NeighborhoodsTable({ districtId, onOpen }: { districtId: string; onOpen: (id: string) => void }) {
  const { neighborhoods, streets, addNeighborhood, updateNeighborhood, deleteNeighborhood } = useData();
  const mine = neighborhoods.filter((n) => n.district_id === districtId);
  const strCount = (id: string) => streets.filter((s) => s.neighborhood_id === id).length;
  const [locFor, setLocFor] = useState<string | null>(null);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [poly, setPoly] = useState<{ lat: number; lng: number }[] | null>(null);

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Nomi</th>
                <th className="px-4 py-3 font-medium">Joylashuv</th>
                <th className="px-4 py-3 font-medium">Ko'chalar</th>
                <th className="px-4 py-3 font-medium text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mine.map((n) => (
                <tr key={n.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-2.5"><EditableCell value={n.name} onSave={(v) => updateNeighborhood(n.id, { name: v })} /></td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => { setLocFor(n.id); setLoc(n.lat !== null && n.lng !== null ? { lat: n.lat, lng: n.lng } : null); setPoly(n.polygon || null); }} className={cn("flex items-center gap-1 text-xs", n.lat !== null || n.polygon ? "text-emerald-600" : "text-slate-400")}>
                      <Icon name="map-pin" size={13} />
                      {n.lat !== null && n.lng !== null ? `${n.lat.toFixed(3)}, ${n.lng.toFixed(3)}` : n.polygon ? "Hudud chizilgan" : "Belgilanmagan"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{strCount(n.id)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => onOpen(n.id)} className="mr-1 rounded-lg p-1.5 text-primary-700 hover:bg-primary-50" aria-label="Ochish"><Icon name="arrow-right" size={15} /></button>
                    <DeleteBtn onClick={() => deleteNeighborhood(n.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-3">
          <AddRow onAdd={async (name) => addNeighborhood(name, districtId)} placeholder="Mahalla nomi" />
        </div>
      </div>

      {locFor && (
        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Joylashuvni belgilash</h3>
            <button onClick={() => setLocFor(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Icon name="close" size={16} /></button>
          </div>
          <LocationPicker value={loc} polygon={poly} onChange={(lat, lng, p) => { setLoc(lat && lng ? {lat, lng} : null); setPoly(p); }} />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setLocFor(null)} className="btn-ghost">Bekor</button>
            <button onClick={async () => { if (locFor) await updateNeighborhood(locFor, { lat: loc?.lat ?? null, lng: loc?.lng ?? null, polygon: poly }); setLocFor(null); }} className="btn-primary">Saqlash</button>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// KO'CHALAR
// =====================================================================
function StreetsTable({ neighborhoodId, onOpen }: { neighborhoodId: string; onOpen: (id: string) => void }) {
  const { streets, buildings, addStreet, updateStreet, deleteStreet } = useData();
  const mine = streets.filter((s) => s.neighborhood_id === neighborhoodId);
  const bldCount = (id: string) => buildings.filter((b) => b.street_id === id).length;

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Nomi</th>
              <th className="px-4 py-3 font-medium">Binolar</th>
              <th className="px-4 py-3 font-medium text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mine.map((s) => (
              <tr key={s.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-2.5"><EditableCell value={s.name} onSave={(v) => updateStreet(s.id, v)} /></td>
                <td className="px-4 py-2.5 text-slate-600">{bldCount(s.id)}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => onOpen(s.id)} className="mr-1 rounded-lg p-1.5 text-primary-700 hover:bg-primary-50" aria-label="Ochish"><Icon name="arrow-right" size={15} /></button>
                  <DeleteBtn onClick={() => deleteStreet(s.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 p-3">
        <AddRow onAdd={async (name) => addStreet(name, neighborhoodId)} placeholder="Ko'cha nomi" />
      </div>
    </div>
  );
}

// =====================================================================
// BINOLAR
// =====================================================================
function BuildingsTable({ streetId }: { streetId: string }) {
  const { buildings, addBuilding, updateBuilding, deleteBuilding } = useData();
  const mine = buildings.filter((b) => b.street_id === streetId);

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Raqam</th>
              <th className="px-4 py-3 font-medium">Nomi</th>
              <th className="px-4 py-3 font-medium text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mine.map((b) => (
              <tr key={b.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-2.5"><EditableCell value={b.number} onSave={(v) => updateBuilding(b.id, { number: v })} /></td>
                <td className="px-4 py-2.5"><EditableCell value={b.name ?? ""} onSave={(v) => updateBuilding(b.id, { name: v || null })} placeholder="—" /></td>
                <td className="px-4 py-2.5 text-right"><DeleteBtn onClick={() => deleteBuilding(b.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 p-3">
        <AddRow onAdd={async (number, name) => addBuilding(number, name, streetId)} placeholder="Raqam (masalan: 12)" twoFields />
      </div>
    </div>
  );
}
