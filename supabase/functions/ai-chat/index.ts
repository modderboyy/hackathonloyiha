// =====================================================================
// CareLink — secure AI chat proxy
// OPENAI_API_KEY faqat Supabase Edge Function secrets ichida saqlanadi.
// Hech qachon Flutter APK yoki browser bundle'iga kiritilmaydi.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ChatItem = { role?: string; content?: string };
type HealthContext = {
  currentCondition?: string | null;
  hospitalDiagnosis?: string | null;
  treatmentSummary?: string | null;
  dischargeRecommendations?: string | null;
  avgBpSys?: number | null;
  avgBpDia?: number | null;
  avgHeartRate?: number | null;
  avgTemperature?: number | null;
  avgSpo2?: number | null;
  allergies?: string | null;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function buildSystemPrompt(health: HealthContext) {
  return `
Sen CareLink tibbiy yordamchi botisan. O'zbek tilida iliq, qisqa va ehtiyotkor javob berasan.
Sen tashxis qo'ymaysan, dori dozasini mustaqil o'zgartirmaysan. Og'ir alomatlarda 103 ga murojaat qilishni aytasan.

Bemorning klinik konteksti:
- Hozirgi holat: ${health.currentCondition ?? "noma'lum"}
- Klinik tashxis: ${health.hospitalDiagnosis ?? "noma'lum"}
- Davolash yakuni: ${health.treatmentSummary ?? "kiritilmagan"}
- Shifokor tavsiyalari: ${health.dischargeRecommendations ?? "kiritilmagan"}
- Qon bosimi: ${health.avgBpSys ?? "—"}/${health.avgBpDia ?? "—"}
- Puls: ${health.avgHeartRate ?? "—"}
- Harorat: ${health.avgTemperature ?? "—"}°C
- SpO2: ${health.avgSpo2 ?? "—"}%
- Allergiyalar: ${health.allergies ?? "noma'lum"}
`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);
  if (req.method !== "POST") return json({ ok: false, error: "POST kerak" }, 405);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ ok: false, error: "Supabase Edge Function secrets sozlanmagan" }, 503);
  if (!OPENAI_API_KEY) return json({ ok: false, error: "OPENAI_API_KEY Edge Function secret sifatida sozlanmagan" }, 503);

  const authorization = req.headers.get("Authorization") ?? "";
  const jwt = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ ok: false, error: "Avtorizatsiya kerak" }, 401);
  const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authData.user) return json({ ok: false, error: "Session topilmadi" }, 401);

  let payload: { message?: string; history?: ChatItem[]; health?: HealthContext };
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Noto'g'ri so'rov" }, 400);
  }

  const message = payload.message?.trim();
  if (!message) return json({ ok: false, error: "Xabar bo'sh" }, 400);

  const history = (payload.history ?? [])
    .filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .slice(-10)
    .map((item) => ({ role: item.role as "user" | "assistant", content: item.content!.slice(0, 2000) }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 420,
      messages: [
        { role: "system", content: buildSystemPrompt(payload.health ?? {}) },
        ...history,
        { role: "user", content: message.slice(0, 3000) },
      ],
    }),
  });

  if (!response.ok) {
    console.error("OpenAI error", response.status, await response.text());
    return json({ ok: false, error: "AI xizmati hozir javob bermadi" }, 502);
  }

  const result = await response.json();
  const reply = result.choices?.[0]?.message?.content?.toString()?.trim();
  if (!reply) return json({ ok: false, error: "AI javobi bo'sh" }, 502);

  return json({ ok: true, reply });
});
