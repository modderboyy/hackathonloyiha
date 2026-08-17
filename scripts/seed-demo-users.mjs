#!/usr/bin/env node
/**
 * CareLink demo users bootstrap.
 * Demo only: never use these simple passwords in production.
 *
 * PowerShell:
 * $env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
 * $env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
 * node .\scripts\seed-demo-users.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  console.error("SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY env qiymatlari kerak.");
  process.exit(1);
}

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const demos = [
  { email: "moddermexc1@gmail.com", password: "12345678", fullName: "CareLink Demo Super Admin", role: "super_admin" },
  { email: "mbuzb0001@gmail.com", password: "123456", fullName: "CareLink Demo Bemor", role: "patient" },
];

async function findUser(email) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found || data.users.length < 1000) return found ?? null;
    page += 1;
  }
}

for (const demo of demos) {
  let user = await findUser(demo.email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: { full_name: demo.fullName, role: demo.role },
    });
    if (error || !data.user) throw error ?? new Error("Demo user yaratilmadi");
    user = data.user;
    console.log(`Created: ${demo.email}`);
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: demo.password,
      email_confirm: true,
      user_metadata: { full_name: demo.fullName, role: demo.role },
    });
    if (updateError) throw updateError;
    console.log(`Reset demo credentials: ${demo.email}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    full_name: demo.fullName,
    role: demo.role,
  }, { onConflict: "id" });
  if (profileError) throw profileError;
}

console.log("Demo accounts ready.");
