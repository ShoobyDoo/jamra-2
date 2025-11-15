/**
 * Bundle Server Script
 * Copies server dist and required node_modules for Tauri bundling
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const bundleDir = path.join(rootDir, "server-bundle");
const serverDistDir = path.join(rootDir, "packages", "server", "dist");
const nodeModulesDir = path.join(rootDir, "node_modules");

// Dependencies that MUST be bundled (especially native modules)
const requiredDependencies = [
  "better-sqlite3",
  "express",
  "ws",
  "cors",
  "nanoid",
  "pino",
  "pino-roll",
  "pino-abstract-transport",
  "pino-std-serializers",
  "thread-stream",
  "on-exit-leak-free",
  "process-warning",
  "real-require",
  "safe-stable-stringify",
  "quick-format-unescaped",
  "fast-redact",
  "atomic-sleep",
  "sonic-boom",
  "cheerio",
  "domhandler",
  // Add Express dependencies
  "body-parser",
  "cookie",
  "cookie-signature",
  "debug",
  "depd",
  "encodeurl",
  "escape-html",
  "etag",
  "finalhandler",
  "forwarded",
  "fresh",
  "http-errors",
  "merge-descriptors",
  "methods",
  "mime",
  "ms",
  "on-finished",
  "parseurl",
  "path-to-regexp",
  "proxy-addr",
  "qs",
  "range-parser",
  "safe-buffer",
  "send",
  "serve-static",
  "setprototypeof",
  "statuses",
  "type-is",
  "utils-merge",
  "vary",
  // Cheerio dependencies
  "htmlparser2",
  "dom-serializer",
  "domelementtype",
  "domutils",
  "entities",
  // WS dependencies
  "utf-8-validate",
  "bufferutil",
];

async function bundleServer() {
  console.log("📦 Bundling server for production...\n");

  try {
    // Clean bundle directory
    console.log("🧹 Cleaning bundle directory...");
    await fs.remove(bundleDir);
    await fs.ensureDir(bundleDir);

    // Copy server dist
    console.log("📋 Copying server dist...");
    await fs.copy(serverDistDir, path.join(bundleDir, "dist"));

    // Create node_modules directory in bundle
    const bundleNodeModules = path.join(bundleDir, "node_modules");
    await fs.ensureDir(bundleNodeModules);

    // Copy required dependencies
    console.log("📦 Bundling dependencies...");
    for (const dep of requiredDependencies) {
      const sourcePath = path.join(nodeModulesDir, dep);
      const targetPath = path.join(bundleNodeModules, dep);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, targetPath, {
          filter: (src) => {
            // Skip unnecessary files to reduce bundle size
            const relativePath = path.relative(sourcePath, src);

            // Skip test files, docs, examples
            if (
              relativePath.match(/\/(test|tests|docs|examples?|\.github)\//)
            ) {
              return false;
            }

            // Skip markdown files except README
            if (
              relativePath.match(/\.md$/) &&
              !relativePath.match(/README\.md$/i)
            ) {
              return false;
            }

            return true;
          },
        });
        console.log(`  ✓ ${dep}`);
      } else {
        console.warn(`  ⚠️  ${dep} not found, skipping...`);
      }
    }

    // Create package.json for the bundle
    const bundlePackageJson = {
      name: "jamra-server-bundle",
      version: "1.0.0",
      type: "module",
      main: "dist/index.js",
      dependencies: requiredDependencies.reduce((acc, dep) => {
        acc[dep] = "*";
        return acc;
      }, {}),
    };

    await fs.writeJson(
      path.join(bundleDir, "package.json"),
      bundlePackageJson,
      { spaces: 2 },
    );

    console.log("\n✅ Server bundle created successfully!");
    console.log(`📁 Bundle location: ${bundleDir}`);

    // Calculate bundle size
    const { size } = await fs.stat(bundleDir);
    const sizeInMB = ((await getFolderSize(bundleDir)) / 1024 / 1024).toFixed(
      2,
    );
    console.log(`📊 Bundle size: ${sizeInMB} MB`);
  } catch (error) {
    console.error("❌ Failed to bundle server:", error);
    process.exit(1);
  }
}

async function getFolderSize(folderPath) {
  let size = 0;
  const files = await fs.readdir(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      size += await getFolderSize(filePath);
    } else {
      size += stats.size;
    }
  }

  return size;
}

bundleServer();
