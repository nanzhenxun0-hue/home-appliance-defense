import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Publishable browser credentials are safe to embed. These defaults keep
// external CI builds (GitHub/Vercel) connected when their env vars are absent.
const CLOUD_URL = process.env.VITE_SUPABASE_URL || "https://xwqhieuadouhsmnsxxag.supabase.co";
const CLOUD_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ba-ZRM1254VpHT0KZ7OunQ_GbmgqDl4";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? './' : '/',
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(CLOUD_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(CLOUD_PUBLISHABLE_KEY),
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
});
