"use client";

import { useActionState } from "react";
import { EmailOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Button, InputAdornment, Stack, TextField } from "@mui/material";

export function LoginForm({ action }: { action: (form: FormData) => Promise<{ error?: string } | void> }) {
  const [state, formAction, pending] = useActionState(async (_previous: { error?: string } | null, formData: FormData) => (await action(formData)) ?? null, null);
  return <form action={formAction}><Stack spacing={2}><TextField required name="email" type="email" label="Email" placeholder="clinic@carelink.uz" InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined fontSize="small" /></InputAdornment> }} /><TextField required name="password" type="password" label="Parol" InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined fontSize="small" /></InputAdornment> }} />{state?.error && <Alert severity="error" sx={{ borderRadius: 2.5 }}>{state.error}</Alert>}<Button type="submit" variant="contained" size="large" fullWidth disabled={pending}>{pending ? "Kirilmoqda…" : "Tizimga kirish"}</Button></Stack></form>;
}
