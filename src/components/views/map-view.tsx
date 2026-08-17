"use client";

import {
  FilterListRounded,
  LocationOnOutlined,
  MapRounded,
  MedicalServicesRounded,
  SearchRounded,
  StarRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/data";

const ClinicMap = dynamic(() => import("@/components/map/ClinicMap"), {
  ssr: false,
  loading: () => <Box sx={{ height: 510, borderRadius: 3, bgcolor: "#EEF4FF" }} />,
});

export function MapOverview() {
  const { profile, facilities, patients } = useData();
  const [query, setQuery] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const scopeClinic = profile?.role === "super_admin" ? null : profile?.clinic_id ?? null;

  const clinics = useMemo(() => facilities
    .filter((facility) => facility.lat != null && facility.lng != null)
    .filter((facility) => !scopeClinic || facility.id === scopeClinic)
    .filter((facility) => !query || `${facility.name} ${facility.address ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .map((facility, index) => ({
      ...facility,
      rating: Number((4.5 + (index % 4) * 0.2).toFixed(1)),
      distance: `${(index + 1) * 1.2} km`,
      emergency: index % 2 === 0,
      doctors: patients.filter((patient) => patient.clinic_id === facility.id).length || 6 + index,
      rooms: 7 + index,
      service: facility.type === "hospital" ? "Kardiologiya" : facility.type === "family_clinic" ? "Umumiy klinika" : "Tibbiy xizmat",
      isOpen: facility.is_active,
    })), [facilities, patients, query, scopeClinic]);

  useEffect(() => {
    if (!clinics.length) {
      setSelectedClinicId(null);
      return;
    }
    if (!selectedClinicId || !clinics.some((clinic) => clinic.id === selectedClinicId)) {
      setSelectedClinicId(clinics[0].id);
    }
  }, [clinics, selectedClinicId]);

  const selectedClinic = clinics.find((clinic) => clinic.id === selectedClinicId) ?? clinics[0] ?? null;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Klinikalar xaritasi</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Real ma'lumotlar bilan ishlaydigan klinika xaritasi</Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.2 } }}>
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Klinika, doktor yoki xizmat qidirish"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ color: "#98A2B3" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField select SelectProps={{ native: true }} size="small" defaultValue="all">
                  <option value="all">Barcha klinikalar</option>
                  <option value="nearest">Eng yaqin</option>
                  <option value="rated">Yuqori reyting</option>
                </TextField>

                <Stack spacing={1.1}>
                  <Chip label="🏥 Klinikalar" sx={{ justifyContent: "flex-start", bgcolor: "#EFF4FF", color: "#155EEF" }} />
                  <Chip label="🚨 Tezkor xizmat" sx={{ justifyContent: "flex-start", bgcolor: "#FEF3F2", color: "#C74B49" }} />
                  <Chip label="⏰ Faol hozir" sx={{ justifyContent: "flex-start", bgcolor: "#ECFDF3", color: "#1FA777" }} />
                </Stack>

                <Divider />

                {selectedClinic && (
                  <Card
                    variant="outlined"
                    sx={{ borderRadius: 3, borderColor: "rgba(15,110,92,0.3)", background: "rgba(15,110,92,0.04)", p: 1.3 }}
                  >
                    <Stack spacing={0.8}>
                      <Typography variant="subtitle1" fontWeight={800}>{selectedClinic.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{selectedClinic.address || "Manzil kiritilmagan"}</Typography>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <StarRounded sx={{ fontSize: 16, color: "#F4B740" }} />
                        <Typography variant="caption" fontWeight={700}>{selectedClinic.rating}</Typography>
                        <Chip size="small" label={selectedClinic.emergency ? "Emergency" : "Standart"} sx={{ bgcolor: selectedClinic.emergency ? "#FEF3F2" : "#EEF4FF", color: selectedClinic.emergency ? "#C74B49" : "#155EEF", height: 22 }} />
                      </Stack>
                      <Stack direction="row" spacing={1.2}>
                        <InfoPill icon={<LocationOnOutlined />} value={selectedClinic.distance} />
                        <InfoPill icon={<MedicalServicesRounded />} value={String(selectedClinic.doctors)} />
                      </Stack>
                    </Stack>
                  </Card>
                )}

                <Stack spacing={1.25}>
                  {clinics.map((clinic) => (
                    <Card
                      key={clinic.id}
                      variant="outlined"
                      onClick={() => setSelectedClinicId(clinic.id)}
                      sx={{ borderRadius: 3, p: 1.2, cursor: "pointer", borderColor: selectedClinic?.id === clinic.id ? "#0F6E5C" : undefined, background: selectedClinic?.id === clinic.id ? "rgba(15,110,92,0.04)" : undefined }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="body2" fontWeight={800}>{clinic.name}</Typography>
                          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.5 }}>
                            <StarRounded sx={{ fontSize: 16, color: "#F4B740" }} />
                            <Typography variant="caption" color="text.secondary">{clinic.rating}</Typography>
                          </Stack>
                        </Box>
                        <Chip size="small" label={clinic.emergency ? "Emergency" : "Standart"} sx={{ bgcolor: clinic.emergency ? "#FEF3F2" : "#EEF4FF", color: clinic.emergency ? "#C74B49" : "#155EEF" }} />
                      </Stack>
                      <Stack direction="row" spacing={1.6} sx={{ mt: 1.25 }}>
                        <InfoPill icon={<LocationOnOutlined />} value={clinic.distance} />
                        <InfoPill icon={<MedicalServicesRounded />} value={String(clinic.doctors)} />
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MapRounded sx={{ color: "#0F6E5C" }} />
                    <Typography variant="h6">Interactive map</Typography>
                  </Stack>
                </Box>
                <Button startIcon={<FilterListRounded />} variant="outlined">Filters</Button>
              </Stack>
              <ClinicMap clinics={clinics as any} selectedId={selectedClinicId} onSelect={setSelectedClinicId} height={510} />
              {selectedClinic && (
                <Box sx={{ mt: 3, p: 2.5, borderRadius: 2.5, border: "1px solid #E5E7EB", bgcolor: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  <Stack spacing={2.5}>
                    {/* Header Section */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                      <Box flex={1}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
                          {selectedClinic.name}
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <LocationOnOutlined sx={{ fontSize: 18, color: "#6B7280" }} />
                          <Typography variant="body2" sx={{ color: "#6B7280", fontWeight: 500 }}>
                            {selectedClinic.address || "Manzil kiritilmagan"}
                          </Typography>
                        </Stack>
                      </Box>
                      <Chip
                        label={selectedClinic.is_active ? "Faol" : "Faol emas"}
                        color={selectedClinic.is_active ? "success" : "default"}
                        variant="filled"
                        sx={{ fontWeight: 700, borderRadius: 1 }}
                      />
                    </Stack>

                    <Divider />

                    {/* Stats Section */}
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#FEF9E7", textAlign: "center" }}>
                          <Stack spacing={0.3}>
                            <Typography variant="caption" sx={{ color: "#92400E", fontWeight: 700 }}>Reyting</Typography>
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.3}>
                              <StarRounded sx={{ fontSize: 18, color: "#F59E0B" }} />
                              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1F2937" }}>
                                {selectedClinic.rating}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#DBEAFE", textAlign: "center" }}>
                          <Stack spacing={0.3}>
                            <Typography variant="caption" sx={{ color: "#0C4A6E", fontWeight: 700 }}>Masofa</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1F2937" }}>
                              {selectedClinic.distance}
                            </Typography>
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#DCFCE7", textAlign: "center" }}>
                          <Stack spacing={0.3}>
                            <Typography variant="caption" sx={{ color: "#15803D", fontWeight: 700 }}>Shifokorlar</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1F2937" }}>
                              {selectedClinic.doctors}
                            </Typography>
                          </Stack>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider />

                    {/* Info Section */}
                    <Stack spacing={1.2}>
                      <InfoRow icon={<MedicalServicesRounded />} label="Xizmat turi" value={selectedClinic.type || "Umumiy"} />
                      <InfoRow
                        icon={<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, fontSize: 12 }}>🏥</Box>}
                        label="Statusı"
                        value={selectedClinic.isOpen ? "Ochiq" : "Yopiq"}
                      />
                      <InfoRow
                        icon={<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, fontSize: 12 }}>📋</Box>}
                        label="Kapalagi"
                        value={selectedClinic.service || "Tibbiy xizmat"}
                      />
                    </Stack>

                    <Divider />

                    {/* Action Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        bgcolor: "#0F6E5C",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        py: 1.3,
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontSize: "0.95rem",
                        "&:hover": { bgcolor: "#0D5A4A" },
                      }}
                    >
                      🏥 Faol klinika
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

function InfoPill({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <Stack direction="row" spacing={0.6} alignItems="center" sx={{ color: "#4F5E5B" }}>
      {icon}
      <Typography variant="caption">{value}</Typography>
    </Stack>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ py: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", color: "#6B7280" }}>
        {icon}
      </Box>
      <Box flex={1}>
        <Typography variant="caption" sx={{ color: "#9CA3AF", fontWeight: 600, display: "block" }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: "#1F2937", fontWeight: 600, mt: 0.2 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}
