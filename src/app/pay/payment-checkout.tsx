"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowBackRounded,
  CheckCircleRounded,
  CreditCardRounded,
  LockRounded,
  ShieldRounded,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const demoCard = "8600 0000 0000 0000";

export default function PaymentCheckout({
  target,
  clinicId,
  clinicName,
}: {
  target: "clinic" | "individual";
  clinicId: string | null;
  clinicName: string | null;
}) {
  const router = useRouter();
  const isClinic = target === "clinic";
  const [cardNumber, setCardNumber] = useState(demoCard);
  const [holder, setHolder] = useState("DEMO KARTA");
  const [expiry, setExpiry] = useState("12/30");
  const [cvv, setCvv] = useState("123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ receipt: string; expiresAt: string; demo?: boolean } | null>(null);
  const price = isClinic ? 29 : 5;

  function formatCard(value: string) {
    return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  async function pay() {
    if (isClinic && !clinicId) {
      setError("Klinika tanlanmagan. Klinika ro‘yxatidan qayta boshlang.");
      return;
    }
    if (cardNumber.replace(/\s/g, "").length !== 16 || !holder.trim() || expiry.length < 5 || cvv.length < 3) {
      setError("Demo karta ma’lumotlarini to‘liq kiriting.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/pay/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, clinicId }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string; receipt?: string; expiresAt?: string; demo?: boolean };
      if (!response.ok || !payload.ok || !payload.receipt || !payload.expiresAt) {
        setError(payload.error ?? "Demo to‘lovni yakunlab bo‘lmadi.");
        return;
      }
      if (payload.demo && typeof window !== "undefined") {
        window.sessionStorage.setItem("carelink-demo-payment", JSON.stringify({ target, clinicId, expiresAt: payload.expiresAt }));
      }
      setSuccess({ receipt: payload.receipt, expiresAt: payload.expiresAt, demo: payload.demo });
    } catch {
      setError("To‘lov xizmatiga ulanib bo‘lmadi. Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, background: "radial-gradient(circle at 10% 5%, #D1FADF, transparent 28%), linear-gradient(135deg, #F8FAFC, #EFF4FF)" }}><Card sx={{ width: "100%", maxWidth: 520, textAlign: "center", boxShadow: "0 24px 56px rgba(16,24,40,.12)" }}><CardContent sx={{ p: { xs: 3, sm: 5 } }}><Avatar sx={{ width: 68, height: 68, mx: "auto", bgcolor: "#ECFDF3", color: "#12B76A" }}><CheckCircleRounded sx={{ fontSize: 38 }} /></Avatar><Typography variant="h4" sx={{ mt: 2.5 }}>Demo to‘lov qabul qilindi</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{isClinic ? `${clinicName || "Klinika"} obunasi faol qilindi.` : "Individual CareLink obunangiz faol qilindi."}</Typography><Box sx={{ mt: 2.5, p: 1.75, borderRadius: 2.5, bgcolor: "#F9FAFB", border: "1px dashed #D0D5DD", textAlign: "left" }}><Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Demo chek</Typography><Typography variant="caption" fontWeight={800}>{success.receipt}</Typography></Stack><Stack direction="row" justifyContent="space-between" sx={{ mt: .75 }}><Typography variant="caption" color="text.secondary">Faol muddat</Typography><Typography variant="caption" fontWeight={800}>{new Date(success.expiresAt).toLocaleDateString("uz-UZ")}</Typography></Stack></Box><Alert severity="success" icon={<ShieldRounded />} sx={{ mt: 2.5, textAlign: "left", borderRadius: 2.5 }}>Bu demo checkout. Haqiqiy karta yechimi amalga oshirilmaydi.</Alert><Button variant="contained" size="large" fullWidth sx={{ mt: 3 }} onClick={() => router.push("/dashboard")}>Boshqaruv paneliga qaytish</Button></CardContent></Card></Box>;
  }

  return <Box sx={{ minHeight: "100vh", py: { xs: 3, md: 7 }, background: "radial-gradient(circle at 95% 4%, #D1E0FF, transparent 27%), linear-gradient(135deg, #F8FAFC, #EFF4FF)" }}><Container maxWidth="md"><Button startIcon={<ArrowBackRounded />} color="inherit" onClick={() => router.back()} sx={{ mb: 2, color: "#475467" }}>Ortga qaytish</Button><Grid container spacing={2.5} alignItems="stretch"><Grid size={{ xs: 12, md: 7 }}><Card sx={{ height: "100%", boxShadow: "0 20px 48px rgba(16,24,40,.10)" }}><CardContent sx={{ p: { xs: 2.5, sm: 4 } }}><Stack direction="row" spacing={1.25} alignItems="center"><Avatar sx={{ bgcolor: "#EFF4FF", color: "#155EEF", borderRadius: 2.5 }}><CreditCardRounded /></Avatar><Box><Typography variant="h5">Demo karta orqali to‘lov</Typography><Typography variant="body2" color="text.secondary">Haqiqiy mablag‘ yechilmaydi.</Typography></Box></Stack><Box sx={{ mt: 3, p: 2.25, borderRadius: 3, color: "#fff", background: "linear-gradient(135deg,#0B1F4A,#155EEF)" }}><Stack direction="row" justifyContent="space-between"><Typography variant="caption" sx={{ opacity: .7 }}>CARELINK DEMO CARD</Typography><CreditCardRounded /></Stack><Typography sx={{ mt: 3, fontFamily: "monospace", fontSize: { xs: 20, sm: 25 }, letterSpacing: ".1em" }}>{demoCard}</Typography><Stack direction="row" justifyContent="space-between" sx={{ mt: 2.5 }}><Typography variant="caption" sx={{ opacity: .8 }}>DEMO KARTA</Typography><Typography variant="caption" sx={{ opacity: .8 }}>12/30</Typography></Stack></Box><Stack spacing={2} sx={{ mt: 3 }}><TextField label="Karta raqami" value={cardNumber} onChange={(event) => setCardNumber(formatCard(event.target.value))} InputProps={{ startAdornment: <InputAdornment position="start"><CreditCardRounded fontSize="small" /></InputAdornment> }} /><TextField label="Karta egasi" value={holder} onChange={(event) => setHolder(event.target.value.toUpperCase())} /><Grid container spacing={2}><Grid size={{ xs: 6 }}><TextField fullWidth label="Amal qilish muddati" placeholder="MM/YY" value={expiry} onChange={(event) => setExpiry(event.target.value.slice(0, 5))} /></Grid><Grid size={{ xs: 6 }}><TextField fullWidth label="CVV" type="password" value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 3))} /></Grid></Grid>{error && <Alert severity="error">{error}</Alert>}<Button variant="contained" size="large" fullWidth onClick={pay} disabled={busy} startIcon={<LockRounded />}>{busy ? "Demo to‘lov tekshirilmoqda…" : `Demo karta bilan $${price} to‘lash`}</Button></Stack></CardContent></Card></Grid><Grid size={{ xs: 12, md: 5 }}><Card sx={{ height: "100%", bgcolor: "#0B1F4A", border: "none", color: "#fff" }}><CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}><Chip label={isClinic ? "KLINIKA OBUNASI" : "INDIVIDUAL OBUNA"} sx={{ bgcolor: "rgba(255,255,255,.12)", color: "#C7D7FE" }} /><Typography variant="h5" sx={{ mt: 2 }}>{isClinic ? clinicName || "Klinika obunasi" : "CareLink individual"}</Typography><Typography sx={{ mt: 1, color: "rgba(255,255,255,.72)", lineHeight: 1.65 }}>{isClinic ? "Klinika faol bo‘lgach, uning chiqarish kodlari bemorlar uchun bepul ishlaydi." : "AI monitoring, reminders va shaxsiy care dashboard bir oy davomida faol."}</Typography><Divider sx={{ my: 3, borderColor: "rgba(255,255,255,.15)" }} /><Stack direction="row" justifyContent="space-between" alignItems="end"><Box><Typography variant="caption" sx={{ color: "rgba(255,255,255,.62)" }}>JAMI</Typography><Typography sx={{ fontWeight: 800, fontSize: 36, letterSpacing: "-.05em" }}>${price}</Typography></Box><Typography variant="body2" sx={{ color: "rgba(255,255,255,.62)" }}>30 kun</Typography></Stack><Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,.15)" }} /><Stack spacing={1.2}>{["Demo chek yaratiladi", "Obuna darhol faollashadi", "Haqiqiy pul yechilmaydi"].map((item) => <Stack key={item} direction="row" spacing={.8} alignItems="center"><CheckCircleRounded sx={{ color: "#6CE9A6", fontSize: 18 }} /><Typography variant="body2" sx={{ color: "rgba(255,255,255,.8)" }}>{item}</Typography></Stack>)}</Stack></CardContent></Card></Grid></Grid></Container></Box>;
}
