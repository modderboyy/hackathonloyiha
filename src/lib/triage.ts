// CareLink — avtomatik yo'naltirish (triage) dvigateli
// Bemor shikoyatini tahlil qilib ixtisoslikka yo'naltiradi.
// Hozirgi versiya: qoidalar (keyword) asosida. Kelajakda haqiqiy AI model
// (masalan, Supabase Edge Function + LLM) bilan almashtirilishi mumkin —
// interfeysi (classifyTriage) o'zgarmaydi.

export interface SpecialtyInfo {
  code: string;
  name: string;
  icon: string;
  confidence: number; // 0..1
}

export const SPECIALTIES: SpecialtyInfo[] = [
  { code: "terapiya", name: "Terapiya (Umumiy)", icon: "stethoscope", confidence: 0 },
  { code: "pediatriya", name: "Pediatriya (Bolalar)", icon: "users", confidence: 0 },
  { code: "stomatologiya", name: "Stomatologiya (Tish)", icon: "smile", confidence: 0 },
  { code: "kardiologiya", name: "Kardiologiya (Yurak)", icon: "heart", confidence: 0 },
  { code: "nevrologiya", name: "Nevrologiya (Asab)", icon: "activity", confidence: 0 },
  { code: "oftalmologiya", name: "Oftalmologiya (Ko'z)", icon: "eye", confidence: 0 },
  { code: "lor", name: "LOR (Quloq-burun-tomoq)", icon: "thermometer", confidence: 0 },
  { code: "ginekologiya", name: "Ginekologiya", icon: "users", confidence: 0 },
  { code: "dermatologiya", name: "Dermatologiya (Teri)", icon: "droplet", confidence: 0 },
];

interface Rule {
  code: string;
  keywords: string[];
  weight: number;
}

const RULES: Rule[] = [
  {
    code: "stomatologiya",
    keywords: ["tish", "tishlar", "milk", "jag", "stomatit", "karies", "og'iz", "og'iz og'rig'i"],
    weight: 5,
  },
  {
    code: "kardiologiya",
    keywords: ["yurak", "ko'krak og'rig", "ko'krak qafas", "gipertoniya", "bosim", "stenokardiya", "aritmiya", "yurak xuruji"],
    weight: 5,
  },
  {
    code: "nevrologiya",
    keywords: ["bosh og'rig", "bosh og'riq", "asab", "uyushish", "falaj", "bosh aylanish", "migren", "tutqanoq", "epilepsiya"],
    weight: 4,
  },
  {
    code: "oftalmologiya",
    keywords: ["ko'z", "ko'rish", "ko'z og'rig", "xiralashish", "qizarish ko'z"],
    weight: 4,
  },
  {
    code: "lor",
    keywords: ["tomoq", "quloq", "burun", "eshitish", "angina", "otit", "rin", "sinusit", "halqum"],
    weight: 4,
  },
  {
    code: "ginekologiya",
    keywords: ["hayz", "bachadon", "ginekolog", "homila", "homilador", "ko'krak bezi", "ayol kasallik"],
    weight: 4,
  },
  {
    code: "dermatologiya",
    keywords: ["teri", "toshma", "qichishish", "qichima", "akne", "ekzema", "dermatit", "allergiya teri"],
    weight: 4,
  },
  {
    code: "pediatriya",
    keywords: ["bola", "bolam", "chaqaloq", "go'dak", "farzand", "yosh bola", "o'g'lim", "qizim", "chaqalog'im", "bolaning"],
    weight: 4,
  },
];

// Bemor yoshini ham hisobga olishi mumkin (ixtiyoriy)
export function classifyTriage(complaint: string, birthDate?: string | null): SpecialtyInfo {
  const text = (complaint || "").toLowerCase();
  const scores: Record<string, number> = {};

  for (const rule of RULES) {
    let hit = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) hit++;
    }
    if (hit > 0) {
      scores[rule.code] = (scores[rule.code] ?? 0) + hit * rule.weight;
    }
  }

  // Yosh qoidalari: 14 yoshgacha → pediatriya ustuvor
  if (birthDate) {
    const age = ageFrom(birthDate);
    if (age !== null && age < 14) {
      scores["pediatriya"] = (scores["pediatriya"] ?? 0) + 8;
    }
  }

  let best: string | null = null;
  let bestScore = 0;
  for (const [code, s] of Object.entries(scores)) {
    if (s > bestScore) {
      best = code;
      bestScore = s;
    }
  }

  const found = SPECIALTIES.find((s) => s.code === best);
  if (!found) {
    const d = SPECIALTIES.find((s) => s.code === "terapiya")!;
    return { ...d, confidence: 0.3 };
  }
  // confidenceni normallashtirish
  const confidence = Math.min(0.95, 0.4 + bestScore / 25);
  return { ...found, confidence };
}

function ageFrom(birthDate: string): number | null {
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
