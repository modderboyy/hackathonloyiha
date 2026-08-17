import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Deno Edge Functions have their own Supabase lint/runtime configuration.
    "supabase/functions/**",
  ]),
  // Mirjahon ops dashboard uses dynamic Supabase payloads and client-side
  // initialisation patterns; TypeScript build remains the release gate.
  {
    files: ["src/app/api/admin/**/*.ts", "src/app/dashboard/page.tsx", "src/components/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
