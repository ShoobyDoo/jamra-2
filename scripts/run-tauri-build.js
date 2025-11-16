/**
 * Wraps the `tauri build` command so we can forward every CLI flag
 * (nsis/msi/no-bundle/etc.) and then sweep the release directory afterward.
 * The post-build sweep only moves our artifacts into `artifacts/`—it leaves all
 * Cargo/Tauri caches alone so incremental builds keep working.
 */

import { spawn } from "child_process";
import { organizeReleaseDirectory } from "./manage-release-dir.js";

const runTauriBuild = (extraArgs) =>
  new Promise((resolve, reject) => {
    const child = spawn("tauri", ["build", ...extraArgs], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve(undefined);
      } else if (code !== null) {
        reject(new Error(`tauri build exited with code ${code}`));
      } else {
        reject(new Error(`tauri build terminated by signal ${signal}`));
      }
    });
  });

const main = async () => {
  const extraArgs = process.argv.slice(2);
  await runTauriBuild(extraArgs);
  await organizeReleaseDirectory();
};

main().catch((error) => {
  console.error("[tauri-build-wrapper] Build failed:", error?.message ?? error);
  process.exit(1);
});
