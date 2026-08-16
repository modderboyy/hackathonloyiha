import type {
  Region,
  Profile,
  Patient,
  ClinicalVisit,
  Vital,
  Hospitalization,
  Discharge,
  FollowUp,
  Notification,
  AuditEntry,
} from "./types";

// --- Hududlar (xarita polygonlari bilan, stilizatsiyalangan) ---
export const REGIONS: Region[] = [
  { id: "r-qk", name: "Qoraqalpog'iston", code: "QR", points: "80,50 300,40 360,120 300,210 150,215 70,150", cx: 205, cy: 130 },
  { id: "r-xo", name: "Xorazm", code: "XO", points: "60,230 160,225 190,330 90,345 55,290", cx: 120, cy: 285 },
  { id: "r-bu", name: "Buxoro", code: "BU", points: "170,225 300,215 320,340 195,345", cx: 245, cy: 285 },
  { id: "r-na", name: "Navoiy", code: "NV", points: "305,215 470,210 480,330 325,340", cx: 395, cy: 278 },
  { id: "r-sa", name: "Samarqand", code: "SA", points: "475,210 600,215 600,330 485,335", cx: 540, cy: 275 },
  { id: "r-ji", name: "Jizzax", code: "JI", points: "605,215 690,220 690,330 605,335", cx: 648, cy: 275 },
  { id: "r-si", name: "Sirdaryo", code: "SI", points: "690,180 745,190 745,280 690,270", cx: 718, cy: 235 },
  { id: "r-tv", name: "Toshkent viloyati", code: "TV", points: "640,60 780,80 800,175 690,180 660,120", cx: 715, cy: 125 },
  { id: "r-ts", name: "Toshkent shahri", code: "TS", points: "700,120 745,120 745,155 700,155", cx: 723, cy: 138 },
  { id: "r-nm", name: "Namangan", code: "NM", points: "745,215 820,230 820,300 745,285", cx: 783, cy: 258 },
  { id: "r-an", name: "Andijon", code: "AN", points: "825,230 880,240 880,305 825,300", cx: 852, cy: 270 },
  { id: "r-fa", name: "Farg'ona", code: "FA", points: "745,290 880,310 880,380 745,360", cx: 812, cy: 335 },
  { id: "r-qa", name: "Qashqadaryo", code: "QK", points: "325,345 600,335 610,470 330,475", cx: 465, cy: 405 },
  { id: "r-su", name: "Surxondaryo", code: "SU", points: "470,480 640,470 660,545 480,550", cx: 565, cy: 512 },
];

export const FACILITIES = [
  { id: "f-1", name: "Markaziy shahar shifoxonasi", type: "hospital" as const, region_id: "r-ts" },
  { id: "f-2", name: "1-son shahar poliklinikasi", type: "polyclinic" as const, region_id: "r-ts" },
  { id: "f-3", name: "Qishloq oilaviy poliklinikasi", type: "family_clinic" as const, region_id: "r-tv" },
  { id: "f-4", name: "Samarqand viloyat shifoxonasi", type: "hospital" as const, region_id: "r-sa" },
  { id: "f-5", name: "Buxoro tuman poliklinikasi", type: "polyclinic" as const, region_id: "r-bu" },
];

export const PROFILES: Profile[] = [
  { id: "u-super", full_name: "Aziz Rahimov", role: "super_admin", phone: "+998 90 000 00 01", facility_id: null, region_id: null },
  { id: "u-admin", full_name: "Nilufar Tosheva", role: "admin", phone: "+998 90 000 00 02", facility_id: "f-2", region_id: "r-ts" },
  { id: "u-doc1", full_name: "Jasur Qodirov", role: "hospital_doctor", phone: "+998 90 000 00 03", facility_id: "f-1", region_id: "r-ts" },
  { id: "u-doc2", full_name: "Madina Yusupova", role: "family_doctor", phone: "+998 90 000 00 04", facility_id: "f-3", region_id: "r-tv" },
  { id: "u-doc3", full_name: "Bekzod Aliyev", role: "family_doctor", phone: "+998 90 000 00 05", facility_id: "f-4", region_id: "r-sa" },
  { id: "u-worker", full_name: "Gulnora Saidova", role: "medical_worker", phone: "+998 90 000 00 06", facility_id: "f-2", region_id: "r-ts" },
];

// Bemorlar — turli hududlarda
export const PATIENTS: Patient[] = [
  { id: "p-1", pinfl: "30104901234567", full_name: "Alisher Karimov", birth_date: "1965-03-12", gender: "male", phone: "+998 91 111 22 33", region_id: "r-tv", address: "Qibray tumani, Yangi qishloq", emergency_contact: "+998 93 222 33 44", created_at: "2026-07-01T09:00:00Z" },
  { id: "p-2", pinfl: "30205802345678", full_name: "Dilnoza Nazarova", birth_date: "1982-07-25", gender: "female", phone: null, region_id: "r-sa", address: "Samarqand shahri, Registon ko'chasi", emergency_contact: "+998 91 555 66 77", created_at: "2026-07-03T10:30:00Z" },
  { id: "p-3", pinfl: null, full_name: "Rustam Mirzayev", birth_date: "1954-11-02", gender: "male", phone: null, region_id: "r-bu", address: "G'ijduvon tumani", emergency_contact: null, created_at: "2026-07-05T14:00:00Z" },
  { id: "p-4", pinfl: "30404123456789", full_name: "Kamola Ergasheva", birth_date: "1991-01-18", gender: "female", phone: "+998 90 777 88 99", region_id: "r-ts", address: "Toshkent, Chilonzor tumani", emergency_contact: "+998 90 888 99 00", created_at: "2026-07-08T08:45:00Z" },
  { id: "p-5", pinfl: "30506214567890", full_name: "Botir Toshmatov", birth_date: "1948-05-30", gender: "male", phone: null, region_id: "r-fa", address: "Marg'ilon shahri", emergency_contact: "+998 91 999 00 11", created_at: "2026-07-10T11:20:00Z" },
  { id: "p-6", pinfl: "30607115678901", full_name: "Zulfiya Axmedova", birth_date: "1975-09-14", gender: "female", phone: "+998 93 333 44 55", region_id: "r-nm", address: "Namangan, Davlatobod tumani", emergency_contact: null, created_at: "2026-07-12T16:10:00Z" },
  { id: "p-7", pinfl: "30708216789012", full_name: "Sherzod Umarov", birth_date: "1998-12-03", gender: "male", phone: "+998 94 666 77 88", region_id: "r-an", address: "Andijon shahri", emergency_contact: "+998 94 555 66 77", created_at: "2026-07-15T09:30:00Z" },
  { id: "p-8", pinfl: null, full_name: "Nodira Ismailova", birth_date: "1960-04-22", gender: "female", phone: null, region_id: "r-qk", address: "Qoraqalpog'iston, Nukus shahri", emergency_contact: "+998 91 444 55 66", created_at: "2026-07-18T13:40:00Z" },
  { id: "p-9", pinfl: "30809217890123", full_name: "Farhod G'aniyev", birth_date: "1988-08-09", gender: "male", phone: "+998 90 111 00 22", region_id: "r-xo", address: "Urganch shahri", emergency_contact: null, created_at: "2026-07-20T10:00:00Z" },
  { id: "p-10", pinfl: "30910218901234", full_name: "Malika Rahimova", birth_date: "2001-06-15", gender: "female", phone: "+998 93 222 11 00", region_id: "r-tv", address: "Parkent tumani", emergency_contact: "+998 93 000 11 22", created_at: "2026-07-22T15:25:00Z" },
  { id: "p-11", pinfl: null, full_name: "Olimjon Sattorov", birth_date: "1943-02-11", gender: "male", phone: null, region_id: "r-qa", address: "Qarshi shahri", emergency_contact: "+998 91 888 77 66", created_at: "2026-07-25T09:15:00Z" },
  { id: "p-12", pinfl: "31011219012345", full_name: "Sevara Karimova", birth_date: "1985-10-28", gender: "female", phone: "+998 94 999 88 77", region_id: "r-su", address: "Termiz shahri", emergency_contact: null, created_at: "2026-07-28T12:50:00Z" },
  { id: "p-13", pinfl: "31112219123456", full_name: "Javohir Islomov", birth_date: "1972-03-05", gender: "male", phone: null, region_id: "r-ji", address: "Jizzax shahri", emergency_contact: "+998 90 333 22 11", created_at: "2026-08-01T10:40:00Z" },
  { id: "p-14", pinfl: "31213219234567", full_name: "Gulchehra Yusufova", birth_date: "1995-12-19", gender: "female", phone: "+998 91 777 66 55", region_id: "r-si", address: "Guliston shahri", emergency_contact: null, created_at: "2026-08-05T14:05:00Z" },
];

export const VISITS: ClinicalVisit[] = [
  { id: "v-1", patient_id: "p-1", facility_id: "f-3", doctor_id: "u-doc2", chief_complaint: "Ko'krak qafasida og'riq, hansirash", diagnosis: "Gipertoniya II daraja", notes: "AB 165/95, tekshiruv tavsiya etildi", recommendations: "EKG, umumiy qon tahlili", visit_date: "2026-07-02T09:30:00Z" },
  { id: "v-2", patient_id: "p-2", facility_id: "f-4", doctor_id: "u-doc3", chief_complaint: "Bosh aylanishi, holsizlik", diagnosis: "Anemiya", notes: "Rangparlik kuzatildi", recommendations: "Temir preparatlari", visit_date: "2026-07-04T10:00:00Z" },
  { id: "v-3", patient_id: "p-4", facility_id: "f-2", doctor_id: "u-worker", chief_complaint: "Yuqori harorat, tomoq og'rig'i", diagnosis: "O'tkir respirator infeksiya", notes: "T 38.2", recommendations: "Ko'p suyuqlik, paratsetamol", visit_date: "2026-07-09T08:50:00Z" },
  { id: "v-4", patient_id: "p-6", facility_id: "f-3", doctor_id: "u-doc2", chief_complaint: "Bosh og'rig'i", diagnosis: "Migren", notes: null, recommendations: "Nevrolog konsultatsiyasi", visit_date: "2026-07-13T11:15:00Z" },
  { id: "v-5", patient_id: "p-10", facility_id: "f-3", doctor_id: "u-doc2", chief_complaint: "Qorin sohasida og'riq", diagnosis: "Gastrit", notes: null, recommendations: "Parhez, gastroskopiya", visit_date: "2026-07-23T09:20:00Z" },
];

export const VITALS: Vital[] = [
  { id: "vt-1", patient_id: "p-1", bp_sys: 165, bp_dia: 95, heart_rate: 88, temperature: 36.6, spo2: 96, weight: 78, measured_at: "2026-07-02T09:30:00Z" },
  { id: "vt-2", patient_id: "p-2", bp_sys: 110, bp_dia: 70, heart_rate: 92, temperature: 36.8, spo2: 97, weight: 58, measured_at: "2026-07-04T10:00:00Z" },
  { id: "vt-3", patient_id: "p-4", bp_sys: 118, bp_dia: 76, heart_rate: 80, temperature: 38.2, spo2: 98, weight: 61, measured_at: "2026-07-09T08:50:00Z" },
  { id: "vt-4", patient_id: "p-5", bp_sys: 150, bp_dia: 90, heart_rate: 84, temperature: 36.7, spo2: 95, weight: 82, measured_at: "2026-07-11T10:10:00Z" },
];

export const HOSPITALIZATIONS: Hospitalization[] = [
  { id: "h-1", patient_id: "p-1", facility_id: "f-1", doctor_id: "u-doc1", admission_date: "2026-07-15", diagnosis: "Gipertonik kriz", status: "discharged" },
  { id: "h-2", patient_id: "p-5", facility_id: "f-1", doctor_id: "u-doc1", admission_date: "2026-07-11", diagnosis: "Pnevmoniya", status: "discharged" },
  { id: "h-3", patient_id: "p-11", facility_id: "f-1", doctor_id: "u-doc1", admission_date: "2026-08-02", diagnosis: "Yurak ishemik kasalligi", status: "discharged" },
];

export const DISCHARGES: Discharge[] = [
  { id: "d-1", hospitalization_id: "h-1", patient_id: "p-1", doctor_id: "u-doc1", discharge_date: "2026-07-22", summary: "Holati barqarorlashdi, AB nazorat ostida", recommendations: "Dori-darmonni muntazam qabul qilish, tuzni cheklash", requires_follow_up: true, follow_up_days: 7, assigned_family_doctor_id: "u-doc2" },
  { id: "d-2", hospitalization_id: "h-2", patient_id: "p-5", doctor_id: "u-doc1", discharge_date: "2026-07-20", summary: "Pnevmoniya yengillashtirildi", recommendations: "Nafas mashqlari, antibiotik kursini davom ettirish", requires_follow_up: true, follow_up_days: 14, assigned_family_doctor_id: null },
  { id: "d-3", hospitalization_id: "h-3", patient_id: "p-11", doctor_id: "u-doc1", discharge_date: "2026-08-09", summary: "Kardiolog nazorati ostida", recommendations: "Kardiolog ko'rigi, kam tuzli parhez", requires_follow_up: true, follow_up_days: 10, assigned_family_doctor_id: null },
];

export const FOLLOWUPS: FollowUp[] = [
  { id: "fu-1", patient_id: "p-1", discharge_id: "d-1", family_doctor_id: "u-doc2", due_date: "2026-07-29", status: "pending", result_notes: null, next_step: null, completed_at: null },
  { id: "fu-2", patient_id: "p-5", discharge_id: "d-2", family_doctor_id: "u-doc2", due_date: "2026-08-03", status: "in_progress", result_notes: null, next_step: null, completed_at: null },
  { id: "fu-3", patient_id: "p-11", discharge_id: "d-3", family_doctor_id: "u-doc3", due_date: "2026-08-19", status: "pending", result_notes: null, next_step: null, completed_at: null },
  { id: "fu-4", patient_id: "p-2", discharge_id: null, family_doctor_id: "u-doc3", due_date: "2026-07-18", status: "completed", result_notes: "Qon tahlili yaxshilandi, temir darajasi ko'tarildi", next_step: "1 oydan keyin nazorat", completed_at: "2026-07-18T12:00:00Z" },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n-1", recipient_id: "u-doc2", type: "follow_up", title: "Yangi kuzatuv so'rovi", body: "Bemor Alisher Karimov statsionardan chiqarildi va 7 kunlik kuzatuvga muhtoj.", patient_id: "p-1", is_read: false, created_at: "2026-07-22T10:00:00Z" },
  { id: "n-2", recipient_id: "u-doc2", type: "follow_up", title: "Yangi kuzatuv so'rovi", body: "Bemor Botir Toshmatov statsionardan chiqarildi va 14 kunlik kuzatuvga muhtoj.", patient_id: "p-5", is_read: false, created_at: "2026-07-20T12:00:00Z" },
  { id: "n-3", recipient_id: "u-super", type: "alert", title: "Kuzatuv muddati yaqinlashmoqda", body: "Alisher Karimov uchun follow-up 2 kun ichida bajarilishi kerak.", patient_id: "p-1", is_read: false, created_at: "2026-08-14T08:00:00Z" },
  { id: "n-4", recipient_id: "u-super", type: "info", title: "Tizim yangilandi", body: "CareLink v1.0 MVP ishga tushirildi.", patient_id: null, is_read: true, created_at: "2026-08-01T09:00:00Z" },
];

export const AUDIT: AuditEntry[] = [
  { id: 1, user_id: "u-worker", action: "INSERT", entity: "patients", entity_id: "p-14", created_at: "2026-08-05T14:05:00Z" },
  { id: 2, user_id: "u-doc1", action: "INSERT", entity: "discharges", entity_id: "d-3", created_at: "2026-08-09T11:00:00Z" },
  { id: 3, user_id: "u-doc2", action: "UPDATE", entity: "follow_ups", entity_id: "fu-2", created_at: "2026-08-10T15:30:00Z" },
  { id: 4, user_id: "u-admin", action: "UPDATE", entity: "profiles", entity_id: "u-worker", created_at: "2026-08-12T09:20:00Z" },
];

// Oylik tashriflar (grafik uchun)
export const MONTHLY_VISITS = [
  { label: "Mart", value: 12 },
  { label: "Aprel", value: 18 },
  { label: "May", value: 24 },
  { label: "Iyun", value: 21 },
  { label: "Iyul", value: 33 },
  { label: "Avgust", value: 27 },
];
