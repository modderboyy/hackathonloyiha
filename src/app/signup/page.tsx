import Link from "next/link";
import { signupAction } from "@/lib/auth";
import { SignupForm } from "./signup-form";
import ThemeRegistry from "@/lib/theme";
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { FavoriteRounded, SmartphoneRounded } from "@mui/icons-material";

export default function SignupPage() {
  return <ThemeRegistry><Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, background: "radial-gradient(circle at 6% 10%, #D1FADF, transparent 26%), linear-gradient(135deg, #F8FAFC, #EFF4FF)" }}><Box sx={{ width: "100%", maxWidth: 470 }}><Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}><Link href="/" style={{ textDecoration: "none" }}><Stack direction="row" alignItems="center" spacing={1}><Avatar sx={{ bgcolor: "#155EEF", borderRadius: 2.5 }}><FavoriteRounded /></Avatar><Typography sx={{ color: "#101828", fontSize: 22, fontWeight: 800, letterSpacing: "-.04em" }}>Care<span style={{ color: "#155EEF" }}>Link</span></Typography></Stack></Link><Chip icon={<SmartphoneRounded />} label="Bemor mobile ilovasi bilan sinxron" sx={{ bgcolor: "#ECFDF3", color: "#027A48" }} /></Stack><Card sx={{ boxShadow: "0 24px 48px rgba(16,24,40,.10)" }}><CardContent sx={{ p: { xs: 2.5, sm: 4 } }}><Typography variant="h4" sx={{ fontSize: 28 }}>Bemor hisobini yarating</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .7, mb: 3 }}>Individual $5 obuna yoki klinikadan olingan kod bilan CareLink kuzatuviga ulaning.</Typography><SignupForm action={signupAction} /><Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>Hisobingiz bormi? <Link href="/login" style={{ color: "#155EEF", fontWeight: 750 }}>Kirish</Link></Typography></CardContent></Card></Box></Box></ThemeRegistry>;
}
