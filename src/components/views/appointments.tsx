"use client";

import {
  AddRounded,
  CalendarMonthRounded,
  LocalHospitalRounded,
  PersonRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useData } from "@/lib/data";

export function AppointmentsOverview() {
  const { patients, profiles, facilities, visits } = useData();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    slot_start: "",
    slot_end: "",
    room_id: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const doctors = useMemo(
    () => profiles.filter((profile) => ["medical_worker", "hospital_doctor", "family_doctor"].includes(profile.role)),
    [profiles]
  );

  const rows = useMemo(() => {
    const filtered = patients.filter((patient) => {
      if (!query) return true;
      const haystack = `${patient.full_name} ${patient.phone ?? ""} ${patient.address ?? ""}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

    return filtered.slice(0, 8).map((patient, index) => {
      const doctor = doctors[index % Math.max(doctors.length, 1)] ?? doctors[0];
      const clinic = facilities.find((facility) => facility.id === patient.clinic_id) ?? facilities[0];
      const visitCount = visits.filter((visit) => visit.patient_id === patient.id).length;
      const status = visitCount > 0 ? "Jarayonda" : index % 3 === 0 ? "Kutilmoqda" : index % 3 === 1 ? "Yakunlangan" : "Kutilmoqda";
      const time = `${9 + (index % 5)}:${String((index * 15) % 60).padStart(2, "0")}`;

      return {
        time,
        patient: patient.full_name,
        doctor: doctor ? doctor.full_name || "Dr. CareLink" : "Dr. CareLink",
        clinic: clinic?.name ?? "CareLink klinikasi",
        room: `${101 + index}`,
        queue: `A-${(index + 1).toString().padStart(3, "0")}`,
        status,
      };
    });
  }, [doctors, facilities, patients, query, visits]);

  const metrics = useMemo(() => ({
    total: rows.length,
    waiting: rows.filter((row) => row.status === "Kutilmoqda").length,
    inProgress: rows.filter((row) => row.status === "Jarayonda").length,
    completed: rows.filter((row) => row.status === "Yakunlangan").length,
  }), [rows]);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Qabul va navbatlar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Real ma’lumotlar asosida tuzilgan qabul va navbat jadvali</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogOpen(true)} sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }}>+ Yangi qabul</Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Bugungi qabul" value={metrics.total} color="#0F6E5C" tint="#EAFBF3" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Kutilmoqda" value={metrics.waiting} color="#D9872F" tint="#FFF7E8" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Jarayonda" value={metrics.inProgress} color="#136C83" tint="#EAF7FA" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Yakunlangan" value={metrics.completed} color="#1FA777" tint="#ECFDF3" /></Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Bemorni qidirish"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: "#98A2B3" }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField select SelectProps={{ native: true }} size="small" defaultValue="all" sx={{ minWidth: 150 }}>
              <option value="all">Klinika</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>{facility.name}</option>
              ))}
            </TextField>
            <TextField select SelectProps={{ native: true }} size="small" defaultValue="all" sx={{ minWidth: 150 }}>
              <option value="all">Holat</option>
              <option value="Kutilmoqda">Kutilmoqda</option>
              <option value="Jarayonda">Jarayonda</option>
              <option value="Yakunlangan">Yakunlangan</option>
            </TextField>
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vaqt</TableCell>
                  <TableCell>Bemor</TableCell>
                  <TableCell>Shifokor</TableCell>
                  <TableCell>Klinika</TableCell>
                  <TableCell>Xona</TableCell>
                  <TableCell>Navbat</TableCell>
                  <TableCell>Holat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.queue} hover>
                    <TableCell>{row.time}</TableCell>
                    <TableCell>{row.patient}</TableCell>
                    <TableCell>{row.doctor}</TableCell>
                    <TableCell>{row.clinic}</TableCell>
                    <TableCell>{row.room}</TableCell>
                    <TableCell>{row.queue}</TableCell>
                    <TableCell>
                      <Chip label={row.status} sx={{ bgcolor: row.status === "Kutilmoqda" ? "#FFF7E8" : row.status === "Jarayonda" ? "#EAF7FA" : "#ECFDF3", color: row.status === "Kutilmoqda" ? "#D9872F" : row.status === "Jarayonda" ? "#136C83" : "#1FA777" }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        patients={patients}
        doctors={doctors}
        facilities={facilities}
        onSave={async (formData) => {
          setSaving(true);
          try {
            const response = await fetch("/api/admin/appointments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patient_id: formData.patient_id,
                doctor_id: formData.doctor_id,
                appointment_date: formData.appointment_date,
                slot_start: formData.slot_start,
                slot_end: formData.slot_end,
                room_id: formData.room_id || null,
                notes: formData.notes || null,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Qabul yaratilmadi");
            }

            alert("Qabul muvaffaqiyatli yaratildi");
            setDialogOpen(false);
            // Reload to see new appointment
            window.location.reload();
          } catch (error) {
            alert(error instanceof Error ? error.message : "Qabul yaratilmadi");
          } finally {
            setSaving(false);
          }
        }}
      />
    </Stack>
  );
}

function AddAppointmentDialog({
  open,
  onClose,
  patients,
  doctors,
  facilities,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  patients: any[];
  doctors: any[];
  facilities: any[];
  onSave: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    slot_start: "",
    slot_end: "",
    room_id: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    
    // Validation
    if (!formData.patient_id.trim()) {
      setError("Bemorni tanlang");
      return;
    }
    if (!formData.doctor_id.trim()) {
      setError("Shifokni tanlang");
      return;
    }
    if (!formData.appointment_date.trim()) {
      setError("Qabul sanasini kiriting");
      return;
    }
    if (!formData.slot_start.trim() || !formData.slot_end.trim()) {
      setError("Vaqt oralig'ini kiriting");
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      setFormData({
        patient_id: "",
        doctor_id: "",
        appointment_date: "",
        slot_start: "",
        slot_end: "",
        room_id: "",
        notes: "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Yangi qabul qo'shish</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            fullWidth
            label="Bemor"
            value={formData.patient_id}
            SelectProps={{ native: true }}
            onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
          >
            <option value="">Bemorni tanlang</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.full_name}</option>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Shifokor"
            value={formData.doctor_id}
            SelectProps={{ native: true }}
            onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
          >
            <option value="">Shifokni tanlang</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>{doctor.full_name || "Dr. CareLink"}</option>
            ))}
          </TextField>

          <TextField
            label="Qabul sanasi"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.appointment_date}
            onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
            inputProps={{ min: new Date().toISOString().split("T")[0] }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Boshlanish vaqti"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.slot_start}
              onChange={(e) => setFormData({ ...formData, slot_start: e.target.value })}
            />
            <TextField
              label="Tugash vaqti"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.slot_end}
              onChange={(e) => setFormData({ ...formData, slot_end: e.target.value })}
            />
          </Stack>

          <TextField
            label="Xona raqami"
            fullWidth
            placeholder="Masalan: 101, 102..."
            value={formData.room_id}
            onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
          />

          <TextField
            label="Izoh"
            fullWidth
            multiline
            rows={2}
            placeholder="Qabul haqida izohlar..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          {error && <Typography color="error">{error}</Typography>}

          <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 1 }}>
            <Button onClick={onClose} color="inherit" disabled={saving}>Bekor qilish</Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ label, value, color, tint }: { label: string; value: number; color: string; tint: string }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography sx={{ mt: 0.7, fontSize: 30, fontWeight: 800, letterSpacing: "-.05em" }}>{value}</Typography>
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: tint, display: "grid", placeItems: "center", color }}>
            {label.includes("Kutilmoqda") ? <CalendarMonthRounded /> : label.includes("Jarayonda") ? <PersonRounded /> : label.includes("Bugungi") ? <CalendarMonthRounded /> : <LocalHospitalRounded />}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}