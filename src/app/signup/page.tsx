import Link from "next/link";
import { signupAction } from "@/lib/auth";
import { SignupForm } from "./signup-form";
import ThemeRegistry from "@/lib/theme";
import { Avatar, Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { FavoriteRounded, MonitorRounded, SmartphoneRounded } from "@mui/icons-material";

export default function SignupPage() {
  return (
    <ThemeRegistry>
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 2,
          background:
            "radial-gradient(circle at top left, rgba(15,110,92,.12), transparent 24%), radial-gradient(circle at bottom right, rgba(19,108,131,.10), transparent 26%), linear-gradient(135deg, #F5F7F4 0%, #ECF3F0 100%)",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1040 }}>
          <Grid container spacing={3} alignItems="stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", p: { xs: 2, md: 3 } }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                  <Stack direction="row" alignItems="center" spacing={1.1} sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: "linear-gradient(135deg, #0F6E5C, #1F5A73)", width: 42, height: 42, borderRadius: 2.5, color: "#F3FBF8" }}>
                      <FavoriteRounded sx={{ fontSize: 21 }} />
                    </Avatar>
                    <Typography sx={{ color: "#11211F", fontSize: 22, fontWeight: 800, letterSpacing: "-.04em" }}>
                      Care<span style={{ color: "#0F6E5C" }}>Link</span>
                    </Typography>
                  </Stack>
                </Link>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "fit-content", bgcolor: "#EAFBF3", border: "1px solid rgba(15,110,92,.12)", color: "#0F6E5C", borderRadius: 999, px: 1.4, py: 0.7, mb: 2.5 }}>
                  <SmartphoneRounded sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.02em" }}>Bemor mobile ilovasi bilan sinxron</Typography>
                </Stack>
                <Typography variant="h2" sx={{ fontSize: { xs: 34, md: 52 }, letterSpacing: "-.05em", lineHeight: 1.04, color: "#11211F" }}>
                  Tibbiy ko‘rsatkichlarni kuzatish boshlanadi.
                </Typography>
                <Typography variant="body1" sx={{ mt: 1.5, maxWidth: 520, color: "#4F5E5B", lineHeight: 1.75 }}>
                  Chiqarishdan keyin dori, kuzatuv va eslatmalar faqat sizga mos, aniq va oson tarzda yetib boradi.
                </Typography>
                <Stack spacing={1.8} sx={{ mt: 3.5 }}>
                  {[
                    "Har kungi eslatmalar va dori jadvali",
                    "Klinikalar bilan real-time kuzatuv",
                    "Yengil, shaffof va xavfsiz foydalanuvchi tajribasi",
                  ].map((item) => (
                    <Stack direction="row" spacing={1.2} alignItems="center" key={item}>
                      <MonitorRounded sx={{ color: "#0F6E5C", fontSize: 19 }} />
                      <Typography variant="body2" sx={{ color: "#11211F", fontWeight: 600 }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: "100%", borderRadius: 4, border: "1px solid rgba(17,34,31,.08)", background: "rgba(255,255,255,.9)", boxShadow: "0 20px 40px rgba(17,34,31,.08)" }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <Typography variant="h4" sx={{ fontSize: 30, color: "#11211F", fontWeight: 800 }}>Bemor hisobini yarating</Typography>
                  <Typography variant="body2" sx={{ mt: 0.8, mb: 3, color: "#4F5E5B", lineHeight: 1.7 }}>
                    Individual $5 obuna yoki klinikadan olingan kod bilan CareLink kuzatuviga ulaning.
                  </Typography>
                  <SignupForm action={signupAction} />
                  <Typography variant="body2" align="center" sx={{ mt: 3, color: "#4F5E5B" }}>
                    Hisobingiz bormi? <Link href="/login" style={{ color: "#0F6E5C", fontWeight: 750 }}>Kirish</Link>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeRegistry>
  );
}
