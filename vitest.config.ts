import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["src/**/*.integration.{test,spec}.{ts,tsx}", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/hooks/queries/**/*.ts",
        "src/api/**/*.ts",
        "src/lib/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.test.tsx",
        "**/*.spec.tsx",
        "**/types/**",
        "**/constants/**",
      ],
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, "./src"),
    },
  },
});
