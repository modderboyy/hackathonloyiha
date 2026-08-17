"use client";

import { useEffect, useState } from "react";
import {
  AddRounded,
  EditRounded,
  DeleteRounded,
  DoorSlidingRounded,
  CleaningServicesRounded,
  AssignmentRounded,
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
  Grid,
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
import { useData } from "@/lib/data";

export function RoomsOverview() {
  const { facilities, profile } = useData();
  const [selectedClinic, setSelectedClinic] = useState<string>(facilities[0]?.id || "");
  const [rooms, setRooms] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", floor: 1, capacity: 1, status: "available" });

  // Role-based clinic filtering
  const isClinicAdmin = profile?.role === "clinic_admin" || profile?.role === "medical_worker";
  const clinicId = isClinicAdmin ? profile?.clinic_id : selectedClinic;
  const visibleFacilities = isClinicAdmin 
    ? facilities.filter((f) => f.id === profile?.clinic_id)
    : facilities;

  useEffect(() => {
    // Set initial clinic
    if (isClinicAdmin && profile?.clinic_id) {
      setSelectedClinic(profile.clinic_id);
    } else if (facilities.length > 0 && !selectedClinic) {
      setSelectedClinic(facilities[0].id);
    }
  }, [isClinicAdmin, profile?.clinic_id, facilities]);

  useEffect(() => {
    if (clinicId) {
      loadRooms();
    }
  }, [clinicId]);

  const loadRooms = async () => {
    try {
      const response = await fetch(`/api/admin/rooms?clinic_id=${clinicId}`);
      if (!response.ok) throw new Error("Failed to load rooms");
      const { data } = await response.json();
      setRooms((data || []).map((room: any) => ({
        ...room,
        floor: Number.isFinite(room.floor) ? room.floor : 1,
        capacity: Number.isFinite(room.capacity) ? room.capacity : 1,
      })));
    } catch (error) {
      console.error("Error loading rooms:", error);
      setRooms([]);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Xona nomi majburiy");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingRoom?.id) {
        response = await fetch("/api/admin/rooms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingRoom.id,
            clinic_id: clinicId,
            ...formData,
          }),
        });
      } else {
        response = await fetch("/api/admin/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinic_id: clinicId,
            ...formData,
          }),
        });
      }

      if (!response.ok) throw new Error("Failed to save room");
      
      setDialogOpen(false);
      setEditingRoom(null);
      setFormData({ name: "", floor: 1, capacity: 1, status: "available" });
      await loadRooms();
    } catch (error) {
      console.error("Error saving room:", error);
      alert("Xona saqlanmadi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Xonani o'chirmoqchisiz?")) return;

    try {
      const response = await fetch("/api/admin/rooms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, clinic_id: clinicId }),
      });

      if (!response.ok) throw new Error("Failed to delete room");
      await loadRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Xona o'chirilmadi");
    }
  };

  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    cleaning: rooms.filter((r) => r.status === "cleaning").length,
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "available":
        return { bg: "#ECFDF3", color: "#1FA777", label: "Boş" };
      case "occupied":
        return { bg: "#FFF7E8", color: "#D9872F", label: "Band" };
      case "cleaning":
        return { bg: "#EAF7FA", color: "#136C83", label: "Toza qilinmoqda" };
      case "maintenance":
        return { bg: "#FFE7E7", color: "#D42C14", label: "Remont" };
      default:
        return { bg: "#F2F4F7", color: "#667085", label: "Noma'lum" };
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Xonalar va kabinalar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Klinikaning xonalarini boshqarish va holati</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => { setEditingRoom(null); setFormData({ name: "", floor: 1, capacity: 1, status: "available" }); setDialogOpen(true); }} sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }}>
          Xona qo'shish
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Jami xonalar" value={stats.total} icon={<DoorSlidingRounded />} color="#0F6E5C" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Boş" value={stats.available} icon={<DoorSlidingRounded />} color="#1FA777" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Band" value={stats.occupied} icon={<AssignmentRounded />} color="#D9872F" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Toza qilinmoqda" value={stats.cleaning} icon={<CleaningServicesRounded />} color="#136C83" /></Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            {isClinicAdmin ? (
              <Box sx={{ p: 1.5, bgcolor: "#EAFBF3", borderRadius: 2, border: "1px solid rgba(15,110,92,0.2)" }}>
                <Typography variant="caption" sx={{ color: "#5A6D68", fontWeight: 600 }}>Sizning klinika</Typography>
                <Typography sx={{ fontWeight: 700, color: "#0F6E5C", mt: 0.5 }}>
                  {visibleFacilities[0]?.name || "Klinika"}
                </Typography>
              </Box>
            ) : (
              <TextField
                select
                fullWidth
                label="Klinika"
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                SelectProps={{ native: true }}
              >
                {visibleFacilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>{facility.name}</option>
                ))}
              </TextField>
            )}
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {!isClinicAdmin && <TableCell>Klinika</TableCell>}
                  <TableCell>Xona nomi</TableCell>
                  <TableCell>Qavat</TableCell>
                  <TableCell>Sig'imi</TableCell>
                  <TableCell>Holati</TableCell>
                  <TableCell align="right">Amallar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => {
                  const status = statusColor(room.status);
                  const clinicName = visibleFacilities.find((f) => f.id === room.clinic_id)?.name || "Klinika";
                  return (
                    <TableRow key={room.id} hover>
                      {!isClinicAdmin && <TableCell>{clinicName}</TableCell>}
                      <TableCell>{room.name}</TableCell>
                      <TableCell>{room.floor}</TableCell>
                      <TableCell>{room.capacity} kishi</TableCell>
                      <TableCell>
                        <Chip label={status.label} sx={{ bgcolor: status.bg, color: status.color }} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button size="small" startIcon={<EditRounded />} onClick={() => { setEditingRoom(room); setFormData({ name: room.name, floor: room.floor, capacity: room.capacity, status: room.status }); setDialogOpen(true); }} />
                          <Button size="small" color="error" startIcon={<DeleteRounded />} onClick={() => handleDelete(room.id)} />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Room Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRoom ? "Xonani tahrirlash" : "Yangi xona qo'shish"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            {/* Clinic Selection/Display */}
            {isClinicAdmin ? (
              <Box sx={{ p: 1.5, bgcolor: "#EAFBF3", borderRadius: 2, border: "1px solid rgba(15,110,92,0.2)" }}>
                <Typography variant="caption" sx={{ color: "#5A6D68", fontWeight: 600 }}>Klinika</Typography>
                <Typography sx={{ fontWeight: 700, color: "#0F6E5C", mt: 0.5 }}>
                  {visibleFacilities[0]?.name || "Klinika"}
                </Typography>
              </Box>
            ) : (
              <TextField
                select
                fullWidth
                label="Klinika"
                value={clinicId || ""}
                onChange={(e) => setSelectedClinic(e.target.value)}
                SelectProps={{ native: true }}
              >
                {visibleFacilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>{facility.name}</option>
                ))}
              </TextField>
            )}

            <TextField
              label="Xona nomi"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masalan: 101, Qabul, Laboratoriya..."
            />
            <TextField
              label="Qavat"
              type="number"
              fullWidth
              value={formData.floor || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, floor: val === "" ? 1 : Math.max(1, parseInt(val) || 1) });
              }}
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Sig'imi (kishi)"
              type="number"
              fullWidth
              value={formData.capacity || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, capacity: val === "" ? 1 : Math.max(1, parseInt(val) || 1) });
              }}
              inputProps={{ min: 1 }}
            />
            <TextField
              select
              fullWidth
              label="Holati"
              value={formData.status}
              SelectProps={{ native: true }}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="available">Boş</option>
              <option value="occupied">Band</option>
              <option value="cleaning">Toza qilinmoqda</option>
              <option value="maintenance">Remont</option>
            </TextField>

            <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 1 }}>
              <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={loading}>Bekor qilish</Button>
              <Button variant="contained" sx={{ bgcolor: "#0F6E5C", "&:hover": { bgcolor: "#0B5C4E" } }} onClick={handleSave} disabled={loading}>
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography sx={{ mt: 0.7, fontSize: 28, fontWeight: 800, color }}>{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 44, height: 44 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}
