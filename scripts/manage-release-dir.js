/**
 * Release directory manager.
 *
 * Keeps `src-tauri/target/release` readable without touching Cargo/Tauri caches.
 * We only move our build artifacts (installers, server bundle, runtime, etc.)
 * into `artifacts/` so caches like `build/` or `deps/` stay untouched.
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const releaseDir = path.join(projectRoot, "src-tauri", "target", "release");
const artifactsDir = path.join(releaseDir, "artifacts");

const cacheEntries = new Set([
  "build",
  "deps",
  "examples",
  "incremental",
  "_up_",
  "CACHEDIR.TAG",
  ".fingerprint",
  ".cargo-lock",
]);

const ensureReleaseDirExists = async () => {
  if (await fs.pathExists(releaseDir)) {
    return true;
  }
  console.warn("[release-manager] Release directory not found; skipping.");
  return false;
};

const moveToArtifacts = async (entry) => {
  const source = path.join(releaseDir, entry);
  const destination = path.join(artifactsDir, entry);
  await fs.remove(destination);
  await fs.move(source, destination, { overwrite: true });
};

export const organizeReleaseDirectory = async () => {
  const releaseExists = await ensureReleaseDirExists();
  if (!releaseExists) {
    return;
  }

  await fs.ensureDir(artifactsDir);
  console.log(
    `[release-manager] Preserving cache entries: ${Array.from(cacheEntries).join(", ")}`,
  );

  const entries = await fs.readdir(releaseDir);
  for (const entry of entries) {
    if (entry === "bundle" || entry === "artifacts" || cacheEntries.has(entry)) {
      continue;
    }

    await moveToArtifacts(entry);
  }
};

const isCliInvocation =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isCliInvocation) {
  const command = process.argv[2];
  if (!command || command === "organize") {
    organizeReleaseDirectory().catch((error) => {
      console.error("[release-manager] Failed to organize release directory:", error);
      process.exit(1);
    });
  }
}
