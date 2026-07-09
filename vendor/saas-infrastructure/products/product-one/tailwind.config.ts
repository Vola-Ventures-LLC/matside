import type { Config } from "tailwindcss";
import sharedConfig from "@saas-infra/config/tailwind";

export default {
  presets: [sharedConfig],
  content: [
    "./src/**/*.{ts,tsx}",
    "./index.html",
    "../../packages/*/src/**/*.{ts,tsx}",
  ],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
