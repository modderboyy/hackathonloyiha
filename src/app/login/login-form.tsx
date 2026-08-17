"use client";

import { useActionState } from "react";
import { EmailOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Button, InputAdornment, Stack, TextField } from "@mui/material";

export function LoginForm({ action }: { action: (form: FormData) => Promise<{ error?: string } | void> }) {
  const [state, formAction, pending] = useActionState(async (_previous: { error?: string } | null, formData: FormData) => (await action(formData)) ?? null, null);

  return (
    <form action={formAction}>
      <Stack spacing={2.2}>
        <TextField
          required
          name="email"
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
      </Stack>
    </form>
  );
}
