"use client";

import { useActionState, useState } from "react";
import { AdminPanelSettingsOutlined, EmailOutlined, LockOutlined, SmartphoneOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Divider, InputAdornment, Stack, TextField, Typography } from "@mui/material";

const DEMO_ACCOUNTS = {
  admin: { email: "moddermexc1@gmail.com", password: "12345678", label: "Super admin demo" },
  patient: { email: "mbuzb0001@gmail.com", password: "123456", label: "Bemor mobile demo" },
};

export function LoginForm({ action }: { action: (form: FormData) => Promise<{ error?: string } | void> }) {
  const [state, formAction, pending] = useActionState(async (_previous: { error?: string } | null, formData: FormData) => (await action(formData)) ?? null, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function fillDemo(kind: keyof typeof DEMO_ACCOUNTS) {
    setEmail(DEMO_ACCOUNTS[kind].email);
    setPassword(DEMO_ACCOUNTS[kind].password);
  }

  return (
    <form action={formAction}>
      <Stack spacing={2.2}>
        <TextField
          required
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          label="Email"
          placeholder="clinic@carelink.uz"
          sx={{
            "& .MuiOutlinedInput-root": {
              background: "rgba(255,255,255,.9)",
              borderRadius: 2.5,
              color: "#11211F",
              "& fieldset": { borderColor: "rgba(17,34,31,.12)" },
              "&:hover fieldset": { borderColor: "rgba(15,110,92,.35)" },
              "&.Mui-focused fieldset": { borderColor: "#0F6E5C" },
            },
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined fontSize="small" sx={{ color: "#0F6E5C" }} /></InputAdornment> }}
        />
        <TextField
          required
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          label="Parol"
          sx={{
            "& .MuiOutlinedInput-root": {
              background: "rgba(255,255,255,.9)",
              borderRadius: 2.5,
              color: "#11211F",
              "& fieldset": { borderColor: "rgba(17,34,31,.12)" },
              "&:hover fieldset": { borderColor: "rgba(15,110,92,.35)" },
              "&.Mui-focused fieldset": { borderColor: "#0F6E5C" },
            },
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined fontSize="small" sx={{ color: "#0F6E5C" }} /></InputAdornment> }}
        />
        {state?.error && (
          <Alert severity="error" sx={{ borderRadius: 2.5, background: "rgba(199,75,73,.08)", color: "#8F2B2D" }}>
            {state.error}
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={pending}
          sx={{
            borderRadius: 2.5,
            background: "linear-gradient(135deg, #0F6E5C 0%, #136C83 100%)",
            color: "#F3FBF8",
            fontWeight: 800,
            letterSpacing: "-.02em",
            py: 1.4,
            boxShadow: "0 16px 30px rgba(15,110,92,.18)",
            "&:hover": { background: "linear-gradient(135deg, #0D5D52 0%, #105F73 100%)" },
          }}
        >
          {pending ? "Kirilmoqda…" : "Tizimga kirish"}
        </Button>

        <Divider sx={{ borderColor: "rgba(17,34,31,.10)" }} />
        <Box sx={{ p: 1.5, borderRadius: 2.5, background: "linear-gradient(135deg, #F0F9F6, #F2F8FA)", border: "1px solid rgba(15,110,92,.12)" }}>
          <Typography variant="caption" sx={{ color: "#0F6E5C", fontWeight: 800, letterSpacing: ".06em" }}>DEMO KIRISH MA’LUMOTLARI</Typography>
          <Stack spacing={1} sx={{ mt: 1.1 }}>
            <DemoAccountRow icon={<AdminPanelSettingsOutlined fontSize="small" />} account={DEMO_ACCOUNTS.admin} onClick={() => fillDemo("admin")} />
            <DemoAccountRow icon={<SmartphoneOutlined fontSize="small" />} account={DEMO_ACCOUNTS.patient} onClick={() => fillDemo("patient")} />
          </Stack>
          <Typography variant="caption" sx={{ display: "block", mt: 1.2, color: "#5A6D68", lineHeight: 1.45 }}>
            Demo foydalanuvchilar avval `scripts/seed-demo-users.mjs` orqali Supabase Auth’da yaratilishi kerak. Productionda bu parollarni ishlatmang.
          </Typography>
        </Box>
      </Stack>
    </form>
  );
}

function DemoAccountRow({
  icon,
  account,
  onClick,
}: {
  icon: React.ReactNode;
  account: { email: string; password: string; label: string };
  onClick: () => void;
}) {
  return (
    <Button type="button" onClick={onClick} variant="outlined" fullWidth sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", borderRadius: 2, borderColor: "rgba(15,110,92,.18)", color: "#11211F", px: 1.15 }}>
      <Stack direction="row" spacing={1} alignItems="center" width="100%">
        <Box sx={{ display: "grid", placeItems: "center", color: "#0F6E5C" }}>{icon}</Box>
        <Box flex={1} minWidth={0}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: 800, color: "#11211F" }}>{account.label}</Typography>
          <Typography variant="caption" sx={{ display: "block", color: "#4F5E5B" }}>{account.email} · {account.password}</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "#0F6E5C", fontWeight: 800 }}>To‘ldirish</Typography>
      </Stack>
    </Button>
  );
}
