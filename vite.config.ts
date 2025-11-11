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
        onstart({ startup }) {
          // Start Electron (not Node.js)
          // Wrap in try-catch to handle stale PID cleanup errors gracefully
          try {
            startup();
          } catch (error) {
            console.warn("Electron startup warning:", error instanceof Error ? error.message : error);
            // Continue anyway - process cleanup errors are usually harmless
          }
        },
        vite: {
          build: {
            outDir: "dist-electron",
            lib: {
              entry: "electron/main.ts",
              formats: ["cjs"],
              fileName: () => "main.cjs",
            },
            rollupOptions: {
              output: {
                format: "cjs",
              },
              // Externalize all server dependencies to avoid bundling issues
              // These will be loaded from node_modules at runtime
              external: [
                // Electron itself must be external
                "electron",
                // Server dependencies (CommonJS packages)
                "express",
                "cors",
                "ws",
                // Native module (must be external)
                "better-sqlite3",
                // Server code itself
                /^\.\.\/server\/dist/,
              ],
            },
          },
        },
      },
      {
        // Preload script entry
        entry: "electron/preload.ts",
        // Build preload as CommonJS so Electron can load it without `type: module`
        // This avoids "Cannot use import statement outside a module" on some hosts
        vite: {
          logLevel: "warn",
          build: {
            lib: {
              entry: "electron/preload.ts",
              formats: ["cjs"],
              fileName: () => "preload.js",
            },
            rollupOptions: {
              output: {
                format: "cjs",
              },
            },
            minify: false,
          },
        },
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete
          options.reload();
        },
      },
    ]),
  ],
});
