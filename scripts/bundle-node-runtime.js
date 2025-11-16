/**
 * Copies the local Node.js runtime into build/node-runtime
 * so packaged bundles can launch the server without requiring
 * a system-wide Node installation.
 */

import fs from "fs-extra";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const buildDir = path.join(projectRoot, "build");
const runtimeDir = path.join(buildDir, "node-runtime");

const platform = process.platform;
const arch = process.arch;
const envRuntimeDir = process.env.NODE_RUNTIME_DIR;
const nodeBinaryName = platform === "win32" ? "node.exe" : "node";

const resolveSourceBinary = () => {
  if (envRuntimeDir) {
    return path.join(envRuntimeDir, nodeBinaryName);
  }
  return process.execPath;
};

const optionalFilesForPlatform = () => {
  if (envRuntimeDir && process.env.NODE_RUNTIME_FILES) {
    return process.env.NODE_RUNTIME_FILES.split(path.delimiter).filter(Boolean);
  }

  if (platform === "win32") {
    return ["node.lib", "node.pdb", "node.exp", "node.exe.sig", "node.lib.sig"];
  }

  return [];
};

const copyIfExists = async (sourceDir, filename, destDir) => {
  const sourcePath = path.join(sourceDir, filename);
  if (await fs.pathExists(sourcePath)) {
    await fs.copy(sourcePath, path.join(destDir, filename));
    return true;
  }
  return false;
};

const bundleNodeRuntime = async () => {
  const sourceBinary = resolveSourceBinary();
  const sourceDir = envRuntimeDir ?? path.dirname(sourceBinary);

  console.log("📦 Bundling Node.js runtime…");
  console.log(`  • Platform: ${platform}`);
  console.log(`  • Arch: ${arch}`);
  console.log(`  • Node version: ${process.version}`);
  console.log(`  • Source binary: ${sourceBinary}`);

  const binaryExists = await fs.pathExists(sourceBinary);
  if (!binaryExists) {
    throw new Error(
      `Node binary not found at ${sourceBinary}. Set NODE_RUNTIME_DIR to a Node.js installation directory.`,
    );
  }

  await fs.remove(runtimeDir);
  await fs.ensureDir(runtimeDir);

  const destBinaryPath = path.join(runtimeDir, nodeBinaryName);
  await fs.copy(sourceBinary, destBinaryPath);

  if (platform !== "win32") {
    await fs.chmod(destBinaryPath, 0o755);
  }

  const extras = optionalFilesForPlatform();
  for (const file of extras) {
    const copied = await copyIfExists(sourceDir, file, runtimeDir);
    if (copied) {
      console.log(`  • Copied ${file}`);
    }
  }

  const metadata = {
    platform,
    arch,
    sourceBinary: sourceBinary,
    nodeVersion: process.version,
    generatedAt: new Date().toISOString(),
    hostname: os.hostname(),
    envOverrides: {
      NODE_RUNTIME_DIR: Boolean(envRuntimeDir),
      NODE_RUNTIME_FILES: Boolean(process.env.NODE_RUNTIME_FILES),
    },
  };

  await fs.writeJson(path.join(runtimeDir, "metadata.json"), metadata, {
    spaces: 2,
  });

  console.log(`✅ Node runtime bundled to ${runtimeDir}`);
};

bundleNodeRuntime().catch((error) => {
  console.error("❌ Failed to bundle Node.js runtime:", error);
  process.exit(1);
});
