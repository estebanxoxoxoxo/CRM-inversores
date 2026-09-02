import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Public URL of the deployment, used by the research prompt to point at the ingest endpoint. */
const appUrl = process.env.VITE_APP_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { "import.meta.env.VITE_APP_URL": JSON.stringify(appUrl) },
});
