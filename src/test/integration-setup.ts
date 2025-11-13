import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Integration tests expect the backend to be running at http://localhost:3000
// Run `pnpm dev:server` in a separate terminal before running integration tests
