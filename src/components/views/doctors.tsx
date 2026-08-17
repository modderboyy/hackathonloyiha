"use client";

import {
  AddRounded,
  CalendarMonthRounded,
  LocalActivityRounded,
  LocalHospitalRounded,
  SearchRounded,
  StarRounded,
  TrendingUpRounded,
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
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useData } from "@/lib/data";

export function DoctorsOverview() {
  const { profile, profiles, facilities, specialties, visits, addDoctor } = useData();
  const [query, setQuery] = useState("");
  const [clinicFilter, setClinicFilter] = useState("Barchasi");
  const [specialtyFilter, setSpecialtyFilter] = useState("Barchasi");
  const [statusFilter, setStatusFilter] = useState("Barchasi");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "medical_worker" as "medical_worker" | "hospital_doctor" | "family_doctor",
    clinic_id: facilities[0]?.id ?? "",
    specialty_id: specialties[0]?.id ?? "",
  });

  const scopeClinic = profile?.role === "super_admin" ? null : profile?.clinic_id ?? null;

  const doctors = useMemo(() => {
    const list = profiles
      .filter((profile) => ["medical_worker", "hospital_doctor", "family_doctor"].includes(profile.role))
      .filter((profile) => !scopeClinic || profile.clinic_id === scopeClinic || profile.facility_id === scopeClinic);

    return list.map((profile, index) => {
      const clinic = facilities.find((facility) => facility.id === profile.clinic_id || facility.id === profile.facility_id) ?? facilities[0];
      const specialty = specialties.find((item) => item.id === profile.specialty_id);
      const todayAppointments = visits.filter((visit) => visit.doctor_id === profile.id && new Date(visit.visit_date).toDateString() === new Date().toDateString()).length;

      return {
        id: profile.id,
        name: profile.full_name || `Dr. ${index + 1}`,
        specialty: specialty?.name ?? "Umumiy tibbiyot",
        clinic: clinic?.name ?? "Klinika belgilanmagan",
        rating: Number((4.5 + ((todayAppointments + index) % 4) * 0.2).toFixed(1)),
        active: todayAppointments > 0 || profile.role === "family_doctor",
        todayAppointments,
        phone: profile.phone ?? "+998 90 000 00 00",
        email: profile.phone ? `${profile.phone.replace(/\D/g, "").slice(-8)}@carelink.uz` : `${profile.full_name?.toLowerCase().replace(/\s+/g, ".") ?? "doctor"}@carelink.uz`,
        experience: `${2 + (index % 5) * 3} yil`,
      };
    });
  }, [profiles, facilities, specialties, visits]);

  const clinicOptions = useMemo(() => ["Barchasi", ...new Set(doctors.map((doctor) => doctor.clinic))], [doctors]);
  const specialtyOptions = useMemo(() => ["Barchasi", ...new Set(doctors.map((doctor) => doctor.specialty))], [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesQuery = !query || `${doctor.name} ${doctor.specialty} ${doctor.clinic}`.toLowerCase().includes(query.toLowerCase());
      const matchesClinic = clinicFilter === "Barchasi" || doctor.clinic === clinicFilter;
      const matchesSpecialty = specialtyFilter === "Barchasi" || doctor.specialty === specialtyFilter;
      const matchesStatus = statusFilter === "Barchasi" || (statusFilter === "Faol" ? doctor.active : !doctor.active);
      return matchesQuery && matchesClinic && matchesSpecialty && matchesStatus;
    });
  }, [clinicFilter, doctors, query, specialtyFilter, statusFilter]);

  const stats = {
    total: doctors.length,
    active: doctors.filter((doctor) => doctor.active).length,
    busy: doctors.filter((doctor) => !doctor.active).length,
    today: doctors.reduce((sum, doctor) => sum + doctor.todayAppointments, 0),
  };

  const saveDoctor = async () => {
    if (!doctorForm.full_name.trim() || !doctorForm.email.trim() || !doctorForm.password.trim()) {
      setDialogError("Ism, email va parol majburiy.");
      return;
    }

    const error = await addDoctor({
      full_name: doctorForm.full_name.trim(),
      email: doctorForm.email.trim(),
      password: doctorForm.password,
      phone: doctorForm.phone.trim() || undefined,
      role: doctorForm.role,
      clinic_id: doctorForm.clinic_id || facilities[0]?.id || null,
      specialty_id: doctorForm.specialty_id || specialties[0]?.id || null,
    });

    if (error) {
      setDialogError(error);
      return;
    }

    setDoctorForm({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      role: "medical_worker",
      clinic_id: facilities[0]?.id ?? "",
      specialty_id: specialties[0]?.id ?? "",
    });
    setDialogError("");
    setDialogOpen(false);
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Shifokorlar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Real profil va klinika ma’lumotlari asosida tuzilgan shifokorlar ro‘yxati</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogOpen(true)} sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }}>Yangi shifokor</Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Jami shifokorlar" value={stats.total} color="#0F6E5C" tint="#EAFBF3" icon={<LocalHospitalRounded />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Faol" value={stats.active} color="#1FA777" tint="#ECFDF3" icon={<TrendingUpRounded />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Band" value={stats.busy} color="#D9872F" tint="#FFF7E8" icon={<LocalActivityRounded />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Bugun qabulda" value={stats.today} color="#136C83" tint="#EAF7FA" icon={<CalendarMonthRounded />} /></Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Shifokorni qidirish..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: "#98A2B3" }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField select SelectProps={{ native: true }} size="small" value={clinicFilter} onChange={(event) => setClinicFilter(event.target.value)} sx={{ minWidth: 160 }}>
              {clinicOptions.map((option) => <option key={option} value={option}>{option === "Barchasi" ? "Klinika" : option}</option>)}
            </TextField>
            <TextField select SelectProps={{ native: true }} size="small" value={specialtyFilter} onChange={(event) => setSpecialtyFilter(event.target.value)} sx={{ minWidth: 180 }}>
              {specialtyOptions.map((option) => <option key={option} value={option}>{option === "Barchasi" ? "Mutaxassislik" : option}</option>)}
            </TextField>
            <TextField select SelectProps={{ native: true }} size="small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 140 }}>
              <option value="Barchasi">Holat</option>
              <option value="Faol">Faol</option>
              <option value="Band">Band</option>
            </TextField>
          </Stack>

          <Grid container spacing={2}>
            {filteredDoctors.map((doctor) => (
              <Grid key={doctor.id} size={{ xs: 12, lg: 6 }}>
                <Card sx={{ height: "100%", border: "1px solid rgba(17,34,31,.08)", transition: "box-shadow .2s ease", "&:hover": { boxShadow: "0 12px 24px rgba(17,34,31,.08)" } }}>
                  <CardContent sx={{ p: 2.2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 52, height: 52, bgcolor: "#EAFBF3", color: "#0F6E5C", fontWeight: 800 }}>{doctor.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap>{doctor.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{doctor.specialty}</Typography>
                      </Box>
                      <Chip label={doctor.active ? "Faol" : "Band"} sx={{ bgcolor: doctor.active ? "#ECFDF3" : "#FFF7E8", color: doctor.active ? "#1FA777" : "#D9872F" }} />
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 2 }}>
                      <LocalHospitalRounded sx={{ fontSize: 18, color: "#0F6E5C" }} />
                      <Typography variant="body2" color="text.secondary">{doctor.clinic}</Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 0.8 }}>
                      <StarRounded sx={{ fontSize: 18, color: "#F4B740" }} />
                      <Typography variant="body2" fontWeight={700}>{doctor.rating}</Typography>
                    </Stack>

                    <Divider sx={{ my: 1.8 }} />

                    <Stack spacing={1}>
                      <InfoRow label="Bugungi qabul" value={`${doctor.todayAppointments}`} />
                      <InfoRow label="Tajriba" value={doctor.experience} />
                      <InfoRow label="Telefon" value={doctor.phone} />
                      <InfoRow label="Email" value={doctor.email} />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                      <Button variant="outlined" fullWidth onClick={() => { setSelectedDoctor(doctor.id); setProfileDialogOpen(true); }}>Profil</Button>
                      <Button variant="contained" fullWidth sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }} onClick={() => { setSelectedDoctor(doctor.id); setScheduleDialogOpen(true); }}>Qabul jadvali</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yangi shifokor qo‘shish</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="To'liq ism" value={doctorForm.full_name} onChange={(event) => setDoctorForm((current) => ({ ...current, full_name: event.target.value }))} />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField fullWidth label="Email" type="email" value={doctorForm.email} onChange={(event) => setDoctorForm((current) => ({ ...current, email: event.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField fullWidth label="Parol" type="password" value={doctorForm.password} onChange={(event) => setDoctorForm((current) => ({ ...current, password: event.target.value }))} />
              </Grid>
            </Grid>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Telefon" value={doctorForm.phone} onChange={(event) => setDoctorForm((current) => ({ ...current, phone: event.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth label="Rol" value={doctorForm.role} SelectProps={{ native: true }} onChange={(event) => setDoctorForm((current) => ({ ...current, role: event.target.value as "medical_worker" | "hospital_doctor" | "family_doctor" }))}>
                  <option value="medical_worker">Tibbiyot xodimi</option>
                  <option value="hospital_doctor">Kasalxona shifokori</option>
                  <option value="family_doctor">Oila shifokori</option>
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth label="Klinika" value={doctorForm.clinic_id} SelectProps={{ native: true }} onChange={(event) => setDoctorForm((current) => ({ ...current, clinic_id: event.target.value }))}>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth label="Mutaxassislik" value={doctorForm.specialty_id} SelectProps={{ native: true }} onChange={(event) => setDoctorForm((current) => ({ ...current, specialty_id: event.target.value }))}>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {dialogError && <Typography variant="body2" color="error.main">{dialogError}</Typography>}

            <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 1 }}>
              <Button onClick={() => setDialogOpen(false)} color="inherit">Bekor qilish</Button>
              <Button variant="contained" onClick={saveDoctor} sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }}>Saqlash</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Doctor Profile Dialog */}
      <ProfileDialog open={profileDialogOpen} onClose={() => { setProfileDialogOpen(false); setSelectedDoctor(null); }} selectedDoctor={selectedDoctor} filteredDoctors={filteredDoctors} />

      {/* Doctor Schedule Dialog */}
      <ScheduleDialog open={scheduleDialogOpen} onClose={() => { setScheduleDialogOpen(false); setSelectedDoctor(null); }} selectedDoctor={selectedDoctor} filteredDoctors={filteredDoctors} />
    </Stack>
  );
}

function MetricCard({ label, value, color, tint, icon }: { label: string; value: number; color: string; tint: string; icon: React.ReactNode }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography sx={{ mt: 0.7, fontSize: 30, fontWeight: 800, letterSpacing: "-.05em", color: "#11211F" }}>{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: tint, color, width: 42, height: 42, borderRadius: 2.5 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ProfileDialog({ 
  open, 
  onClose, 
  selectedDoctor, 
  filteredDoctors 
}: { 
  open: boolean; 
  onClose: () => void; 
  selectedDoctor: string | null; 
  filteredDoctors: any[]; 
}) {
  const doctor = selectedDoctor ? filteredDoctors.find((d) => d.id === selectedDoctor) : null;
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "", specialty: "" });
  const [saving, setSaving] = useState(false);

  const handleEditClick = () => {
    if (doctor) {
      setEditForm({
        full_name: doctor.name,
        phone: doctor.phone,
        email: doctor.email,
        specialty: doctor.specialty
      });
      setEditMode(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!doctor || !editForm.full_name.trim()) {
      alert("To'liq ism majburiy");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doctor.id,
          full_name: editForm.full_name.trim(),
          phone: editForm.phone.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Profil saqlanmadi");
      }

      setEditMode(false);
      onClose();
      alert("Profil muvaffaqiyatli yangilandi!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Profil saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open && !!doctor} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Shifokor profili</DialogTitle>
      <DialogContent>
        {doctor && (
          <Stack spacing={2} sx={{ pt: 2 }}>
            {!editMode ? (
              <>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: "#EAFBF3", color: "#0F6E5C", fontWeight: 800, fontSize: 28, mb: 1.5 }}>
                    {doctor.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2)}
                  </Avatar>
                  <Typography variant="h6">{doctor.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{doctor.specialty}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Klinika</Typography>
                  <Typography variant="body2">{doctor.clinic}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Telefon</Typography>
                  <Typography variant="body2">{doctor.phone}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{doctor.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Tajriba</Typography>
                  <Typography variant="body2">{doctor.experience}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Reyting</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <StarRounded sx={{ color: "#F4B740", fontSize: 20 }} />
                    <Typography variant="body2">{doctor.rating}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Bugungi qabul</Typography>
                  <Typography variant="body2">{doctor.todayAppointments} ta</Typography>
                </Box>
                <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 1 }}>
                  <Button onClick={onClose} color="inherit">Yopish</Button>
                  <Button variant="contained" sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }} onClick={handleEditClick}>Tahrirlash</Button>
                </Stack>
              </>
            ) : (
              <>
                <TextField
                  label="To'liq ism"
                  fullWidth
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
                <TextField
                  label="Mutaxassislik"
                  fullWidth
                  value={editForm.specialty}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                />
                <TextField
                  label="Telefon"
                  fullWidth
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
                <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 1 }}>
                  <Button onClick={() => setEditMode(false)} color="inherit" disabled={saving}>Bekor qilish</Button>
                  <Button variant="contained" sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }} onClick={handleSaveEdit} disabled={saving}>
                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDialog({ 
  open, 
  onClose, 
  selectedDoctor, 
  filteredDoctors 
}: { 
  open: boolean; 
  onClose: () => void; 
  selectedDoctor: string | null; 
  filteredDoctors: any[]; 
}) {
  const doctor = selectedDoctor ? filteredDoctors.find((d) => d.id === selectedDoctor) : null;
  const weekDays = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
  const [schedule, setSchedule] = useState<Record<number, { start: string; end: string; room: string }>>({
    0: { start: "09:00", end: "17:00", room: "" },
    1: { start: "09:00", end: "17:00", room: "" },
    2: { start: "09:00", end: "17:00", room: "" },
    3: { start: "09:00", end: "17:00", room: "" },
    4: { start: "09:00", end: "17:00", room: "" },
    5: { start: "09:00", end: "14:00", room: "" },
  });
  const [loading, setLoading] = useState(false);

  const handleSaveSchedule = async () => {
    if (!doctor) return;
    
    // Validate that at least some schedules have values
    const hasValidSchedules = Object.values(schedule).some(s => s.start && s.end);
    if (!hasValidSchedules) {
      alert("Kamida bitta kun uchun vaqt kiriting");
      return;
    }

    setLoading(true);
    try {
      // Convert form data to API format
      const schedules = Object.entries(schedule).map(([weekday, times]) => ({
        weekday: parseInt(weekday),
        start_time: times.start,
        end_time: times.end,
        room_name: times.room || null,
      }));

      const response = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: doctor.id,
          schedules,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Jadval saqlanmadi");
      }

      alert("Jadval muvaffaqiyatli saqlandi");
      onClose();
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Jadval saqlanmadi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open && !!doctor} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Qabul jadvali - {doctor?.name}</DialogTitle>
      <DialogContent>
        {doctor && (
          <Stack spacing={2.5} sx={{ pt: 2 }}>
            {weekDays.map((day, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: "1px solid #eee",
                  borderRadius: 1,
                  "&:hover": { bgcolor: "#fafafa" }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {day}
                </Typography>
                <Stack spacing={1}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      label="Boshlanish"
                      type="time"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={schedule[index]?.start || "09:00"}
                      onChange={(e) => setSchedule(s => ({
                        ...s,
                        [index]: { ...s[index], start: e.target.value }
                      }))}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Tugash"
                      type="time"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={schedule[index]?.end || "17:00"}
                      onChange={(e) => setSchedule(s => ({
                        ...s,
                        [index]: { ...s[index], end: e.target.value }
                      }))}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                  <TextField
                    label="Xona raqami"
                    size="small"
                    placeholder="101, 102..."
                    value={schedule[index]?.room || ""}
                    onChange={(e) => setSchedule(s => ({
                      ...s,
                      [index]: { ...s[index], room: e.target.value }
                    }))}
                  />
                </Stack>
              </Box>
            ))}

            <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 1 }}>
              <Button onClick={onClose} color="inherit">Bekor qilish</Button>
              <Button
                variant="contained"
                sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }}
                onClick={handleSaveSchedule}
                disabled={loading}
              >
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={1}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "#11211F", textAlign: "right" }}>{value}</Typography>
    </Stack>
  );
}
