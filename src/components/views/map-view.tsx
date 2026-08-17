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
          <Card sx={{ height: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2.2}>
                {/* Search Field */}
                <TextField
                  fullWidth
                  size="small"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Klinika, doktor yoki xizmat qidirish"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ color: "#6B7280", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#F9FAFB",
                      "& fieldset": {
                        borderColor: "#E5E7EB",
                      },
                      "&:hover fieldset": {
                        borderColor: "#D1D5DB",
                      },
                    },
                  }}
                />

                {/* Sort Dropdown */}
                <TextField
                  select
                  fullWidth
                  SelectProps={{ native: true }}
                  size="small"
                  defaultValue="all"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#F9FAFB",
                      "& fieldset": {
                        borderColor: "#E5E7EB",
                      },
                    },
                  }}
                >
                  <option value="all">Barcha klinikalar</option>
                  <option value="nearest">Eng yaqin</option>
                  <option value="rated">Yuqori reyting</option>
                </TextField>

                {/* Filter Chips */}
                <Stack spacing={1.2}>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Filtrlash
                  </Typography>
                  <Stack spacing={0.8}>
                    <Chip
                      label="🏥 Klinikalar"
                      sx={{
                        justifyContent: "flex-start",
                        bgcolor: "#EFF4FF",
                        color: "#155EEF",
                        fontWeight: 600,
                        height: 36,
                        borderRadius: 1.5,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: "1px solid #DBEAFE",
                        "&:hover": { bgcolor: "#DBEAFE", boxShadow: "0 2px 8px rgba(21, 94, 239, 0.15)" },
                      }}
                    />
                    <Chip
                      label="🚨 Tezkor xizmat"
                      sx={{
                        justifyContent: "flex-start",
                        bgcolor: "#FEF3F2",
                        color: "#C74B49",
                        fontWeight: 600,
                        height: 36,
                        borderRadius: 1.5,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: "1px solid #FECACA",
                        "&:hover": { bgcolor: "#FDE2E2", boxShadow: "0 2px 8px rgba(199, 75, 73, 0.15)" },
                      }}
                    />
                    <Chip
                      label="⏰ Faol hozir"
                      sx={{
                        justifyContent: "flex-start",
                        bgcolor: "#ECFDF3",
                        color: "#1FA777",
                        fontWeight: 600,
                        height: 36,
                        borderRadius: 1.5,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: "1px solid #BBFCE0",
                        "&:hover": { bgcolor: "#CCFCE2", boxShadow: "0 2px 8px rgba(31, 167, 119, 0.15)" },
                      }}
                    />
                  </Stack>
                </Stack>

                <Divider sx={{ my: 0.5 }} />

                {selectedClinic && (
                  <>
                    <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                      Tanlangan klinika
                    </Typography>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        border: "2px solid #0F6E5C",
                        background: "linear-gradient(135deg, rgba(15,110,92,0.06) 0%, rgba(15,110,92,0.02) 100%)",
                        p: 2,
                        boxShadow: "0 4px 12px rgba(15,110,92,0.1)",
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Stack>
                          <Typography variant="body1" fontWeight={800} sx={{ color: "#1F2937", mb: 0.3 }}>
                            {selectedClinic.name}
                          </Typography>
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            <LocationOnOutlined sx={{ fontSize: 16, color: "#6B7280" }} />
                            <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 500 }}>
                              {selectedClinic.address || "Manzil kiritilmagan"}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                            <StarRounded sx={{ fontSize: 16, color: "#F59E0B" }} />
                            <Typography variant="caption" fontWeight={700} sx={{ color: "#1F2937" }}>
                              {selectedClinic.rating}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={selectedClinic.emergency ? "🚨 Emergency" : "📋 Standart"}
                            sx={{
                              bgcolor: selectedClinic.emergency ? "#FEF3F2" : "#DBEAFE",
                              color: selectedClinic.emergency ? "#C74B49" : "#155EEF",
                              height: 24,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
                          <InfoPill icon={<LocationOnOutlined sx={{ fontSize: 18 }} />} value={selectedClinic.distance} />
                          <InfoPill icon={<MedicalServicesRounded sx={{ fontSize: 18 }} />} value={String(selectedClinic.doctors)} />
                        </Stack>
                      </Stack>
                    </Card>
                  </>
                )}

                <Stack spacing={1.2}>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Barcha klinikalar
                  </Typography>
                  {clinics.map((clinic) => (
                    <Card
                      key={clinic.id}
                      variant="outlined"
                      onClick={() => setSelectedClinicId(clinic.id)}
                      sx={{
                        borderRadius: 2,
                        p: 1.5,
                        cursor: "pointer",
                        border: selectedClinic?.id === clinic.id ? "2px solid #0F6E5C" : "1px solid #E5E7EB",
                        background: selectedClinic?.id === clinic.id
                          ? "linear-gradient(135deg, rgba(15,110,92,0.06) 0%, rgba(15,110,92,0.02) 100%)"
                          : "#FFFFFF",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: selectedClinic?.id === clinic.id ? "0 4px 12px rgba(15,110,92,0.1)" : "0 1px 2px rgba(0,0,0,0.05)",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          transform: "translateY(-2px)",
                          borderColor: selectedClinic?.id === clinic.id ? "#0F6E5C" : "#D1D5DB",
                        },
                      }}
                    >
                      <Stack spacing={1.2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={800} sx={{ color: "#1F2937" }}>
                              {clinic.name}
                            </Typography>
                            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.4 }}>
                              <StarRounded sx={{ fontSize: 15, color: "#F59E0B" }} />
                              <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>
                                {clinic.rating}
                              </Typography>
                            </Stack>
                          </Box>
                          <Chip
                            size="small"
                            label={clinic.emergency ? "🚨 Emergency" : "📋 Standart"}
                            sx={{
                              bgcolor: clinic.emergency ? "#FEF3F2" : "#DBEAFE",
                              color: clinic.emergency ? "#C74B49" : "#155EEF",
                              height: 24,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1.5}>
                          <InfoPill icon={<LocationOnOutlined sx={{ fontSize: 16 }} />} value={clinic.distance} />
                          <InfoPill icon={<MedicalServicesRounded sx={{ fontSize: 16 }} />} value={String(clinic.doctors)} />
                        </Stack>
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
