import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    electron([
      {
        // Main process entry
        entry: "electron/main.ts",
      },
      {
        // Preload script entry
        entry: "electron/preload.ts",
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete
          options.reload();
        },
      },
    ]),
  ],
});
