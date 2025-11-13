import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/integration-setup.ts"],
    include: ["src/**/*.integration.test.{ts,tsx}"],
    // Integration tests may take longer
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, "./src"),
    },
  },
});
