import Link from "next/link";
import { loginAction } from "@/lib/auth";
import { LoginForm } from "./login-form";
import ThemeRegistry from "@/lib/theme";
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { FavoriteRounded, ShieldRounded } from "@mui/icons-material";

export default function LoginPage() {
  return <ThemeRegistry><Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, background: "radial-gradient(circle at 95% 8%, #D1E0FF, transparent 27%), linear-gradient(135deg, #F8FAFC, #EFF4FF)" }}><Box sx={{ width: "100%", maxWidth: 440 }}><Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}><Link href="/" style={{ textDecoration: "none" }}><Stack direction="row" alignItems="center" spacing={1}><Avatar sx={{ bgcolor: "#155EEF", borderRadius: 2.5 }}><FavoriteRounded /></Avatar><Typography sx={{ color: "#101828", fontSize: 22, fontWeight: 800, letterSpacing: "-.04em" }}>Care<span style={{ color: "#155EEF" }}>Link</span></Typography></Stack></Link><Chip icon={<ShieldRounded />} label="Xavfsiz klinik kirish" sx={{ bgcolor: "#EFF4FF", color: "#175CD3" }} /></Stack><Card sx={{ boxShadow: "0 24px 48px rgba(16,24,40,.10)" }}><CardContent sx={{ p: { xs: 2.5, sm: 4 } }}><Typography variant="h4" sx={{ fontSize: 28 }}>Tizimga kirish</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .7, mb: 3 }}>Super admin va tibbiyot xodimlari uchun boshqaruv maydoni.</Typography><LoginForm action={loginAction} /><Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>Bemor hisobingiz yo‘qmi? <Link href="/signup" style={{ color: "#155EEF", fontWeight: 750 }}>Hisob yaratish</Link></Typography></CardContent></Card></Box></Box></ThemeRegistry>;
}
