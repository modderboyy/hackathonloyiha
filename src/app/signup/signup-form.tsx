"use client";

import { useActionState } from "react";
import { EmailOutlined, LockOutlined, PersonOutlineRounded, PhoneOutlined } from "@mui/icons-material";
import { Alert, Button, InputAdornment, Stack, TextField } from "@mui/material";

export function SignupForm({ action }: { action: (form: FormData) => Promise<{ error?: string } | void> }) {
  const [state, formAction, pending] = useActionState(async (_previous: { error?: string } | null, formData: FormData) => (await action(formData)) ?? null, null);
  return <form action={formAction}><Stack spacing={2}><TextField required name="full_name" label="Ism-familiya" placeholder="Dilnoza Karimova" InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineRounded fontSize="small" /></InputAdornment> }} /><TextField name="phone" label="Telefon raqami (ixtiyoriy)" placeholder="+998 90 000 00 00" InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined fontSize="small" /></InputAdornment> }} /><TextField required name="email" type="email" label="Email" placeholder="siz@email.uz" InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined fontSize="small" /></InputAdornment> }} /><TextField required name="password" type="password" label="Parol" helperText="Kamida 8 ta belgi" inputProps={{ minLength: 8 }} InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined fontSize="small" /></InputAdornment> }} />{state?.error && <Alert severity="info" sx={{ borderRadius: 2.5 }}>{state.error}</Alert>}<Button type="submit" disabled={pending} variant="contained" size="large" fullWidth>{pending ? "Hisob yaratilmoqda…" : "Bemor hisobini yaratish"}</Button></Stack></form>;
}
