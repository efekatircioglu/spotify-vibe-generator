import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "@next/next/no-img-element": "warn", // Allow img elements but warn
      "react-hooks/exhaustive-deps": "warn", // Allow missing dependencies but warn
      "@next/next/no-page-custom-font": "warn", // Allow custom fonts but warn
    },
  },
];

export default eslintConfig;
