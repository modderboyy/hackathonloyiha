"use client";

import { useActionState } from "react";
import { EmailOutlined, LockOutlined, PersonOutlineRounded, PhoneOutlined } from "@mui/icons-material";
import { Alert, Button, InputAdornment, Stack, TextField } from "@mui/material";

export function SignupForm({ action }: { action: (form: FormData) => Promise<{ error?: string } | void> }) {
  const [state, formAction, pending] = useActionState(async (_previous: { error?: string } | null, formData: FormData) => (await action(formData)) ?? null, null);

  return (
    <form action={formAction}>
      <Stack spacing={2.2}>
        <TextField
          required
          name="full_name"
          label="Ism-familiya"
          placeholder="Dilnoza Karimova"
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
          InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineRounded fontSize="small" sx={{ color: "#0F6E5C" }} /></InputAdornment> }}
        />
        <TextField
          name="phone"
          label="Telefon raqami (ixtiyoriy)"
          placeholder="+998 90 000 00 00"
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
          InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined fontSize="small" sx={{ color: "#0F6E5C" }} /></InputAdornment> }}
        />
        <TextField
          required
          name="email"
          type="email"
          label="Email"
          placeholder="siz@email.uz"
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
          type="password"
          label="Parol"
          helperText="Kamida 8 ta belgi"
          inputProps={{ minLength: 8 }}
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
          <Alert severity="info" sx={{ borderRadius: 2.5, background: "rgba(15,110,92,.08)", color: "#0B4C40" }}>
            {state.error}
          </Alert>
        )}
        <Button
          type="submit"
          disabled={pending}
          variant="contained"
          size="large"
          fullWidth
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
          {pending ? "Hisob yaratilmoqda…" : "Bemor hisobini yaratish"}
        </Button>
      </Stack>
    </form>
  );
}
