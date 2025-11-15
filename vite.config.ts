import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const FRONTEND_OUT_DIR = "build/frontend";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    outDir: FRONTEND_OUT_DIR,
    emptyOutDir: true,
  },
});
