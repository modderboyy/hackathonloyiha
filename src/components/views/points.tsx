"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { Badge, Modal, Field, Input, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { Building, District, Neighborhood, Region, Street } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Points() {
  const { regions, districts, neighborhoods, streets, buildings, profile } = useData();
  const [regionId, setRegionId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);
  const [streetId, setStreetId] = useState<string | null>(null);

  const canEdit = profile?.role === "super_admin" || profile?.role === "admin" || profile?.role === "district_admin";

  const regionDistricts = useMemo(() => districts.filter((d) => d.region_id === regionId), [districts, regionId]);
  const districtNeighborhoods = useMemo(() => neighborhoods.filter((n) => n.district_id === districtId), [neighborhoods, districtId]);
  const neighborhoodStreets = useMemo(() => streets.filter((s) => s.neighborhood_id === neighborhoodId), [streets, neighborhoodId]);
  const streetBuildings = useMemo(() => buildings.filter((b) => b.street_id === streetId), [buildings, streetId]);

  const crumb = useMemo(() => {
    const parts: { label: string; clear: () => void }[] = [];
    if (regionId) {
      const r = regions.find((x) => x.id === regionId);
      parts.push({ label: r?.name ?? "?", clear: () => { setRegionId(null); setDistrictId(null); setNeighborhoodId(null); setStreetId(null); } });
    }
    if (districtId) {
      const d = districts.find((x) => x.id === districtId);
      parts.push({ label: d?.name ?? "?", clear: () => { setDistrictId(null); setNeighborhoodId(null); setStreetId(null); } });
    }
    if (neighborhoodId) {
      const n = neighborhoods.find((x) => x.id === neighborhoodId);
      parts.push({ label: n?.name ?? "?", clear: () => { setNeighborhoodId(null); setStreetId(null); } });
    }
    if (streetId) {
      const s = streets.find((x) => x.id === streetId);
      parts.push({ label: s?.name ?? "?", clear: () => { setStreetId(null); } });
    }
    return parts;
  }, [regionId, districtId, neighborhoodId, streetId, regions, districts, neighborhoods, streets]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Punktlar (Manzillar)</h1>
        <p className="text-sm text-slate-500">
          Viloyat → Tuman → Mahalla → Ko&lsquo;cha → Bino → Raqam
        </p>
      </div>

      {/* Breadcrumb */}
      {crumb.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <button onClick={() => { setRegionId(null); setDistrictId(null); setNeighborhoodId(null); setStreetId(null); }} className="text-primary-700 hover:underline">
            Viloyatlar
          </button>
          {crumb.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <Icon name="chevron-right" size={14} className="text-slate-400" />
              <button onClick={c.clear} className="font-medium text-primary-700 hover:underline">
                {c.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Viloyat darajasi */}
      {!regionId && (
        <LevelCard
          title="Viloyatlar"
          count={regions.length}
          canEdit={canEdit}
          items={regions.map((r) => ({ id: r.id, label: r.name, sub: r.code }))}
          onSelect={(id) => setRegionId(id)}
        />
      )}

      {/* Tuman darajasi */}
      {regionId && !districtId && (
        <LevelCard
          title="Tumanlar"
          count={regionDistricts.length}
          canEdit={canEdit}
          items={regionDistricts.map((d) => ({ id: d.id, label: d.name }))}
          onSelect={(id) => setDistrictId(id)}
        />
      )}

      {/* Mahalla darajasi */}
      {districtId && !neighborhoodId && (
        <LevelCard
          title="Mahallalar"
          count={districtNeighborhoods.length}
          canEdit={canEdit}
          items={districtNeighborhoods.map((n) => ({ id: n.id, label: n.name }))}
          onSelect={(id) => setNeighborhoodId(id)}
        />
      )}

      {/* Ko'cha darajasi */}
      {neighborhoodId && !streetId && (
        <LevelCard
          title="Ko'chalar"
          count={neighborhoodStreets.length}
          canEdit={canEdit}
          items={neighborhoodStreets.map((s) => ({ id: s.id, label: s.name }))}
          onSelect={(id) => setStreetId(id)}
        />
      )}

      {/* Bino darajasi */}
      {streetId && (
        <LevelCard
          title="Binolar"
          count={streetBuildings.length}
          canEdit={canEdit}
          items={streetBuildings.map((b) => ({ id: b.id, label: b.number, sub: b.name ?? undefined }))}
          onSelect={() => {}}
          leaf
        />
      )}

      {/* Qo'shish tugmalari */}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          {!regionId && <AddButton label="Viloyat" onClick={() => {}} type="region" />}
          {regionId && !districtId && <AddButton label="Tuman" onClick={() => {}} type="district" regionId={regionId} />}
          {districtId && !neighborhoodId && <AddButton label="Mahalla" onClick={() => {}} type="neighborhood" districtId={districtId} />}
          {neighborhoodId && !streetId && <AddButton label="Ko'cha" onClick={() => {}} type="street" neighborhoodId={neighborhoodId} />}
          {streetId && <AddButton label="Bino" onClick={() => {}} type="building" streetId={streetId} />}
        </div>
      )}
    </div>
  );
}

function LevelCard({
  title,
  count,
  items,
  onSelect,
  canEdit,
  leaf,
}: {
  title: string;
  count: number;
  items: { id: string; label: string; sub?: string }[];
  onSelect: (id: string) => void;
  canEdit?: boolean;
  leaf?: boolean;
}) {
  if (count === 0) {
    return (
      <div className="card">
        <h2 className="mb-1 font-semibold text-slate-900">{title}</h2>
        <EmptyState icon="map-pin" title={`${title} yo'q`} desc="Bu darajada hozircha yozuv mavjud emas." />
      </div>
    );
  }
  return (
    <div className="card">
      <h2 className="mb-3 font-semibold text-slate-900">
        {title} <span className="text-slate-400">({count})</span>
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => !leaf && onSelect(it.id)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm transition",
              leaf ? "cursor-default" : "hover:border-primary-300 hover:bg-primary-50/50"
            )}
          >
            <span className="flex items-center gap-2">
              <Icon name="map-pin" size={15} className="text-primary-600" />
              <span className="font-medium text-slate-800">{it.label}</span>
              {it.sub && <span className="text-xs text-slate-400">{it.sub}</span>}
            </span>
            {!leaf && <Icon name="chevron-right" size={15} className="text-slate-300" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddButton({
  label,
  onClick,
  type,
  regionId,
  districtId,
  neighborhoodId,
  streetId,
}: {
  label: string;
  onClick: () => void;
  type: string;
  regionId?: string;
  districtId?: string;
  neighborhoodId?: string;
  streetId?: string;
}) {
  const { addDistrict, addNeighborhood, addStreet, addBuilding } = useData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    let error: string | null = null;
    if (type === "district" && regionId) error = await addDistrict(name, regionId);
    else if (type === "neighborhood" && districtId) error = await addNeighborhood(name, districtId);
    else if (type === "street" && neighborhoodId) error = await addStreet(name, neighborhoodId);
    else if (type === "building" && streetId) error = await addBuilding(number || name, name, streetId);
    setBusy(false);
    if (error) setErr(error);
    else {
      setName("");
      setNumber("");
      setOpen(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Icon name="plus" size={16} /> {label} qo&lsquo;shish
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`${label} qo'shish`}>
        <form onSubmit={submit} className="space-y-4">
          {type === "building" ? (
            <>
              <Field label="Raqam" required>
                <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Masalan: 12" />
              </Field>
              <Field label="Bino nomi" optional>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: 'Nurli' uyi" />
              </Field>
            </>
          ) : (
            <Field label="Nomi" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${label} nomi`} />
            </Field>
          )}
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Bekor qilish</button>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saqlanmoqda..." : "Saqlash"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
