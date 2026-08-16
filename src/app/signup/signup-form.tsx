"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { District, Neighborhood, Region } from "@/lib/types";

export function SignupForm({ action }: { action: (f: FormData) => Promise<{ error?: string } | void> }) {
  const supabase = useMemo(() => createClient(), []);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [state, formAction, pending] = useActionState(async (_prev: { error?: string } | null, formData: FormData) => {
    return (await action(formData)) ?? null;
  }, null);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      if (!supabase) return;

      const [regionsRes, districtsRes, neighborhoodsRes] = await Promise.all([
        supabase.from("regions").select("*").order("name"),
        supabase.from("districts").select("*").order("name"),
        supabase.from("neighborhoods").select("*").order("name"),
      ]);

      if (!mounted) return;
      setRegions((regionsRes.data as Region[]) ?? []);
      setDistricts((districtsRes.data as District[]) ?? []);
      setNeighborhoods((neighborhoodsRes.data as Neighborhood[]) ?? []);
    }

    void loadOptions();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const districtOptions = districts.filter((d) => d.region_id === selectedRegion);
  const neighborhoodOptions = neighborhoods.filter((n) => n.district_id === selectedDistrict);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="label">Ism</label>
          <input id="first_name" name="first_name" type="text" required className="field" placeholder="Dilnoza" />
        </div>
        <div>
          <label htmlFor="last_name" className="label">Familya</label>
          <input id="last_name" name="last_name" type="text" required className="field" placeholder="Karimova" />
        </div>
      </div>

      <div>
        <label htmlFor="birth_date" className="label">Tug'ilgan sana</label>
        <input id="birth_date" name="birth_date" type="date" required className="field" />
      </div>

      <div>
        <label htmlFor="email" className="label">Login (email)</label>
        <input id="email" name="email" type="email" required className="field" placeholder="doctor@carelink.uz" />
      </div>

      <div>
        <label htmlFor="password" className="label">Parol</label>
        <input id="password" name="password" type="password" required minLength={6} className="field" placeholder="Kamida 6 ta belgi" />
      </div>

      <div>
        <label htmlFor="region_id" className="label">Viloyat</label>
        <select
          id="region_id"
          name="region_id"
          value={selectedRegion}
          required
          className="field"
          onChange={(event) => {
            setSelectedRegion(event.target.value);
            setSelectedDistrict("");
          }}
        >
          <option value="">Viloyatni tanlang</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>{region.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="district_id" className="label">Tuman</label>
        <select
          id="district_id"
          name="district_id"
          value={selectedDistrict}
          required
          className="field"
          disabled={!selectedRegion}
          onChange={(event) => setSelectedDistrict(event.target.value)}
        >
          <option value="">Tumanni tanlang</option>
          {districtOptions.map((district) => (
            <option key={district.id} value={district.id}>{district.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="neighborhood_id" className="label">Mahalla</label>
        <select
          id="neighborhood_id"
          name="neighborhood_id"
          required
          className="field"
          disabled={!selectedDistrict}
        >
          <option value="">Mahallani tanlang</option>
          {neighborhoodOptions.map((neighborhood) => (
            <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name}</option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
        {pending ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
      </button>
    </form>
  );
}
