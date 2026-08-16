// O'zbekiston hududlarining taxminiy koordinatalari (Leaflet/OSM uchun)
// [lat, lng] ko'rinishida, MVP uchun soddalashtirilgan poligonlar
export interface RegionGeo {
  code: string;
  points: [number, number][];
  center: [number, number];
}

export const REGION_GEO: Record<string, RegionGeo> = {
  QR: {
    // Qoraqalpog'iston
    code: "QR",
    points: [
      [45.3, 56.0], [45.0, 60.5], [43.5, 62.0], [42.0, 61.5],
      [41.2, 58.5], [41.6, 56.5], [43.0, 56.0], [44.5, 56.3],
    ],
    center: [42.3, 59.0],
  },
  XO: {
    // Xorazm
    code: "XO",
    points: [
      [41.8, 60.0], [42.2, 61.5], [41.0, 61.8], [40.3, 60.8],
      [40.4, 60.0], [41.2, 60.0],
    ],
    center: [41.0, 60.7],
  },
  BU: {
    // Buxoro
    code: "BU",
    points: [
      [41.6, 62.0], [41.8, 64.5], [40.3, 65.2], [39.2, 64.5],
      [39.2, 62.5], [40.4, 62.0],
    ],
    center: [40.3, 63.6],
  },
  NV: {
    // Navoiy
    code: "NV",
    points: [
      [43.2, 62.0], [43.0, 65.5], [41.5, 66.0], [40.6, 65.2],
      [40.9, 62.5], [42.0, 62.0],
    ],
    center: [41.7, 63.8],
  },
  SA: {
    // Samarqand
    code: "SA",
    points: [
      [40.6, 65.5], [40.8, 67.0], [39.7, 67.2], [39.0, 66.4],
      [39.1, 65.3], [39.9, 65.2],
    ],
    center: [39.9, 66.2],
  },
  JI: {
    // Jizzax
    code: "JI",
    points: [
      [40.8, 67.2], [40.9, 69.0], [40.0, 69.2], [39.5, 68.2],
      [39.6, 67.0], [40.2, 67.0],
    ],
    center: [40.2, 68.0],
  },
  QK: {
    // Qashqadaryo
    code: "QK",
    points: [
      [40.0, 64.5], [39.9, 67.0], [38.6, 67.3], [38.0, 66.0],
      [38.1, 64.5], [39.0, 64.5],
    ],
    center: [39.0, 65.8],
  },
  SU: {
    // Surxondaryo
    code: "SU",
    points: [
      [38.2, 66.0], [38.0, 68.5], [37.4, 69.5], [37.2, 67.0],
      [37.6, 66.0],
    ],
    center: [37.8, 67.5],
  },
  SI: {
    // Sirdaryo
    code: "SI",
    points: [
      [41.0, 68.3], [41.1, 69.8], [40.2, 70.0], [39.8, 68.8],
      [40.2, 68.2],
    ],
    center: [40.5, 69.0],
  },
  TV: {
    // Toshkent viloyati
    code: "TV",
    points: [
      [42.5, 68.5], [42.3, 71.5], [40.9, 71.8], [40.6, 69.5],
      [41.2, 68.3],
    ],
    center: [41.7, 70.0],
  },
  TS: {
    // Toshkent shahri
    code: "TS",
    points: [
      [41.35, 69.15], [41.40, 69.35], [41.25, 69.40], [41.18, 69.20],
    ],
    center: [41.28, 69.27],
  },
  NM: {
    // Namangan
    code: "NM",
    points: [
      [41.6, 70.5], [41.5, 72.0], [41.0, 72.3], [40.8, 71.0],
      [41.0, 70.4],
    ],
    center: [41.1, 71.2],
  },
  AN: {
    // Andijon
    code: "AN",
    points: [
      [40.9, 72.0], [40.8, 73.0], [40.5, 73.1], [40.5, 72.0],
    ],
    center: [40.7, 72.5],
  },
  FA: {
    // Farg'ona
    code: "FA",
    points: [
      [40.8, 70.5], [40.7, 72.5], [40.2, 72.7], [40.0, 71.0],
      [40.3, 70.3],
    ],
    center: [40.4, 71.4],
  },
};

// deep ko'k shkala — bemorlar soniga qarab rang
export function regionColor(count: number, max: number): string {
  if (max <= 0 || count <= 0) return "#dbeafe";
  const t = count / max;
  const r = Math.round(219 - t * 160); // 219 → 59
  const g = Math.round(234 - t * 176); // 234 → 58
  const b = Math.round(254 - t * 116); // 254 → 138
  return `rgb(${r}, ${g}, ${b})`;
}
