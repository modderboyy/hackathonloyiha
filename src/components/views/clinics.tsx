"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  AddRounded,
  CheckCircleRounded,
  EditRounded,
  EmailOutlined,
  LockOutlined,
  LocationOnOutlined,
  LocalHospitalRounded,
  MapRounded,
  PhoneOutlined,
  SearchRounded,
  CreditCardRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useData, type ClinicInput } from "@/lib/data";
import type { Facility } from "@/lib/types";

const ClinicMap = dynamic(() => import("@/components/map/ClinicMap"), { ssr: false, loading: () => <Box sx={{ height: 390, bgcolor: "#EEF4FF", borderRadius: 3 }} /> });

const UZBEKISTAN_BOUNDS = {
  minLat: 36.7,
  maxLat: 46.4,
  minLng: 55.0,
  maxLng: 74.7,
};

function clampToUzbekistan(lat: number | null | undefined, lng: number | null | undefined) {
  const safeLat = Number.isFinite(lat) ? Number(lat) : 41.3111;
  const safeLng = Number.isFinite(lng) ? Number(lng) : 69.2797;

  return {
    lat: Math.min(Math.max(safeLat, UZBEKISTAN_BOUNDS.minLat), UZBEKISTAN_BOUNDS.maxLat),
    lng: Math.min(Math.max(safeLng, UZBEKISTAN_BOUNDS.minLng), UZBEKISTAN_BOUNDS.maxLng),
  };
}

export function Clinics() {
  const { profile, facilities, patients, addClinic, updateClinic } = useData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Facility | "new" | null>(null);
  const [tab, setTab] = useState<"list" | "map">("list");

  const scopeClinic = profile?.role === "super_admin" ? null : profile?.clinic_id ?? null;
  const shown = useMemo(
    () => facilities
      .filter((clinic) => !scopeClinic || clinic.id === scopeClinic)
      .filter((clinic) => `${clinic.name} ${clinic.email ?? ""} ${clinic.address ?? ""}`.toLowerCase().includes(query.toLowerCase())),
    [facilities, query, scopeClinic]
  );

  const active = shown.filter((clinic) => clinic.is_active && ["active", "trial"].includes(clinic.subscription_status ?? "inactive")).length;
  const patientCount = (id: string) => patients.filter((patient) => patient.clinic_id === id).length;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Klinikalar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Klinikalar obunasi, real joylashuv va xarita bo‘yicha boshqaruv</Typography>
        </Box>
        {!scopeClinic && <Button variant="contained" size="large" startIcon={<AddRounded />} onClick={() => setEditing("new")}>Klinika qo‘shish</Button>}
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}><AdminMetric label="Jami klinikalar" value={facilities.length} icon={<LocalHospitalRounded />} color="#155EEF" tint="#EFF4FF" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><AdminMetric label="Obunasi faol" value={active} icon={<CheckCircleRounded />} color="#12B76A" tint="#ECFDF3" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><AdminMetric label="Bog‘langan bemorlar" value={patients.length} icon={<LocalHospitalRounded />} color="#7A5AF8" tint="#F4EBFF" /></Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <MapRounded sx={{ color: "#155EEF" }} />
                <Typography variant="h6">Klinikalar</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>Real ma’lumotlar asosida klinikalar ro‘yxati va xaritasi</Typography>
            </Box>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ minHeight: 0 }}>
              <Tab label="Klinikalar" value="list" />
              <Tab label="Klinikalar xaritasi" value="map" />
            </Tabs>
          </Stack>

          {tab === "map" ? (
            <Box>
              <Chip label={`${active} faol / ${facilities.length} jami`} color="success" variant="outlined" sx={{ mb: 2 }} />
              <ClinicMap clinics={shown} selectedId={selectedId} onSelect={setSelectedId} height={390} />
            </Box>
          ) : (
            <Stack spacing={2}>
              <TextField
                fullWidth
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Klinika, email yoki manzil bo‘yicha qidirish…"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: "#98A2B3" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Grid container spacing={2}>
                {shown.map((clinic) => {
                  const isActive = Boolean(clinic.is_active && ["active", "trial"].includes(clinic.subscription_status ?? "inactive"));

                  return (
                    <Grid key={clinic.id} size={{ xs: 12, md: 6 }}>
                      <Card sx={{ height: "100%", borderColor: selectedId === clinic.id ? "#84ADFF" : "#EAECF0", transition: "border .2s, box-shadow .2s", "&:hover": { boxShadow: "0 10px 24px rgba(16,24,40,.08)" } }}>
                        <CardContent sx={{ p: { xs: 2.1, sm: 2.5 } }}>
                          <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                            <Stack direction="row" spacing={1.15} minWidth={0}>
                              <Avatar sx={{ bgcolor: isActive ? "#EFF4FF" : "#F2F4F7", color: isActive ? "#155EEF" : "#667085", borderRadius: 2.5 }}><LocalHospitalRounded /></Avatar>
                              <Box minWidth={0}>
                                <Typography variant="subtitle1" noWrap>{clinic.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{patientCount(clinic.id)} ta bemor bog‘langan</Typography>
                              </Box>
                            </Stack>
                            <Chip size="small" label={subscriptionLabel(clinic.subscription_status)} color={isActive ? "success" : clinic.subscription_status === "expired" ? "error" : "default"} variant={isActive ? "filled" : "outlined"} />
                          </Stack>

                          <Divider sx={{ my: 2 }} />

                          <Stack spacing={1.05}>
                            <DataRow icon={<EmailOutlined />} value={clinic.email || "Login email kiritilmagan"} />
                            <DataRow icon={<LockOutlined />} value="Parol himoyalangan · faqat yangilash mumkin" />
                            <DataRow icon={<PhoneOutlined />} value={clinic.phone || "Telefon kiritilmagan"} />
                            <DataRow icon={<LocationOnOutlined />} value={clinic.address || "Manzil kiritilmagan"} />
                          </Stack>

                          <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 2.25 }}>
                            <Button variant="outlined" startIcon={<EditRounded />} onClick={() => setEditing(clinic)} fullWidth>Tahrirlash</Button>
                            <Button variant="contained" color={isActive ? "primary" : "success"} startIcon={<CreditCardRounded />} onClick={() => router.push(`/pay?target=clinic&clinicId=${encodeURIComponent(clinic.id)}&clinic=${encodeURIComponent(clinic.name)}`)} fullWidth>Obuna</Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Stack>
          )}
        </CardContent>
      </Card>

      {editing && <ClinicDialog clinic={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={async (input) => editing === "new" ? addClinic(input) : updateClinic(editing.id, input)} />}
    </Stack>
  );
}

function ClinicDialog({ clinic, onClose, onSave }: { clinic: Facility | null; onClose: () => void; onSave: (input: ClinicInput) => Promise<string | null> }) {
  const initialPoint = clampToUzbekistan(clinic?.lat ?? 41.3111, clinic?.lng ?? 69.2797);
  const [form, setForm] = useState<ClinicInput>({
    name: clinic?.name ?? "",
    email: clinic?.email ?? "",
    password: "",
    phone: clinic?.phone ?? "",
    address: clinic?.address ?? "",
    lat: initialPoint.lat,
    lng: initialPoint.lng,
    radius_km: clinic?.radius_km ?? 3,
    subscription_status: clinic?.subscription_status ?? "inactive",
    subscription_expires_at: clinic?.subscription_expires_at?.slice(0, 10) ?? "",
    type: clinic?.type ?? "hospital",
  });
  const [selectedLocation, setSelectedLocation] = useState({ lat: initialPoint.lat, lng: initialPoint.lng });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof ClinicInput>(key: K, value: ClinicInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const updateLocation = useCallback((lat: number, lng: number) => {
    const normalized = clampToUzbekistan(lat, lng);
    setSelectedLocation({ lat: normalized.lat, lng: normalized.lng });
    set("lat", normalized.lat);
    set("lng", normalized.lng);
  }, []);

  async function save() {
    if (!form.name.trim() || !form.email.trim()) { setError("Klinika nomi va login email majburiy."); return; }
    if (!clinic && !form.password) { setError("Yangi klinika uchun vaqtinchalik kirish parolini kiriting."); return; }
    if (form.password && form.password.length < 8) { setError("Parol kamida 8 belgidan iborat bo‘lsin."); return; }

    const normalized = clampToUzbekistan(form.lat, form.lng);
    setForm((current) => ({ ...current, lat: normalized.lat, lng: normalized.lng }));
    setBusy(true);
    const result = await onSave({
      ...form,
      lat: normalized.lat,
      lng: normalized.lng,
      name: form.name.trim(),
      email: form.email.trim(),
      subscription_expires_at: form.subscription_expires_at ? new Date(`${form.subscription_expires_at}T23:59:59`).toISOString() : null,
    });
    setBusy(false);
    if (result) setError(result); else onClose();
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Typography variant="h6" component="div">{clinic ? "Klinikani tahrirlash" : "Yangi klinika yaratish"}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{clinic ? "Login ma’lumoti xavfsiz yangilanadi." : "Klinika uchun medical worker login hisobini xavfsiz yarating."}</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField required label="Klinika nomi" value={form.name} onChange={(event) => set("name", event.target.value)} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField required fullWidth label="Klinika login emaili" type="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField fullWidth label={clinic ? "Yangi parol (ixtiyoriy)" : "Vaqtinchalik parol"} type="password" value={form.password ?? ""} onChange={(event) => set("password", event.target.value)} helperText={clinic ? "Bo‘sh qoldirilsa o‘zgarmaydi" : "Parol bazada ochiq saqlanmaydi"} />
            </Grid>
          </Grid>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Telefon" value={form.phone ?? ""} onChange={(event) => set("phone", event.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth disabled label="Obuna holati" value={subscriptionLabel(form.subscription_status)} helperText="Faollashtirish demo checkout orqali bajariladi" />
            </Grid>
          </Grid>
          <TextField fullWidth label="Manzil" value={form.address ?? ""} onChange={(event) => set("address", event.target.value)} />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Klinika joylashuvi</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>🗺️ Xaritani bosing — joyni belgilang, yoki quyidagi koordinatalarni to'g'rilang</Typography>
          </Box>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Kenglik (lat)" type="number" value={form.lat ?? ""} onChange={(event) => { const next = Number(event.target.value); if (!Number.isFinite(next)) return; const normalized = clampToUzbekistan(next, form.lng); set("lat", normalized.lat); updateLocation(normalized.lat, normalized.lng); }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Uzunlik (lng)" type="number" value={form.lng ?? ""} onChange={(event) => { const next = Number(event.target.value); if (!Number.isFinite(next)) return; const normalized = clampToUzbekistan(form.lat, next); set("lng", normalized.lng); updateLocation(normalized.lat, normalized.lng); }} />
            </Grid>
          </Grid>
          <Box sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid rgba(17,34,31,.08)" }}>
            <ClinicMap
              clinics={clinic ? [clinic] : []}
              selectedLocation={selectedLocation}
              onLocationSelect={updateLocation}
              height={200}
              showRadius={false}
            />
          </Box>
          {error && <Typography color="error.main" variant="body2">{error}</Typography>}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 0.5 }}>
            <Button onClick={onClose} color="inherit">Bekor qilish</Button>
            <Button variant="contained" onClick={save} disabled={busy} sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }}>
              {busy ? "Saqlanmoqda..." : clinic ? "Saqlash" : "Yaratish"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function AdminMetric({ label, value, icon, color, tint }: { label: string; value: number; icon: React.ReactNode; color: string; tint: string }) {
  return (
    <Card>
      <CardContent sx={{ p: 2.15 }}>
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>{label}</Typography>
            <Typography sx={{ mt: 0.5, fontWeight: 800, fontSize: 31, lineHeight: 1, letterSpacing: "-.05em" }}>{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: tint, color, borderRadius: 2.5 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DataRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color: "#98A2B3", display: "grid" }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{value}</Typography>
    </Stack>
  );
}

function subscriptionLabel(status?: string) {
  return ({ active: "Obuna faol", trial: "Sinov obunasi", inactive: "Faol emas", expired: "Muddati tugagan" } as Record<string, string>)[status ?? "inactive"] ?? "Faol emas";
}