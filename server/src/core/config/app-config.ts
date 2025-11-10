import path from "node:path";

export interface CatalogConfig {
  defaultRepoId: string;
  defaultRepoName: string;
  defaultRepoUrl: string;
  cacheTtlSeconds: number;
  drivers: Array<"http" | "filesystem">;
}

interface ExtensionsConfig {
  installDir: string;
  bundleDir: string;
  runtime: {
    timeoutMs: number;
    maxHeapMb: number;
  };
}

interface SandboxConfig {
  allowNetworkHosts: string[];
}

interface InstallerConfig {
  concurrency: number;
  tempDir: string;
  verifySignatures: boolean;
}

interface SettingsConfig {
  tableName: string;
}

export interface AppConfig {
  env: "development" | "production" | "test";
  catalog: CatalogConfig;
  extensions: ExtensionsConfig;
  installer: InstallerConfig;
  sandbox: SandboxConfig;
  settings: SettingsConfig;
}

const parseBoolean = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : value.toLowerCase() === "true";

const parseNumber = (value: string | undefined, fallback: number): number => {
  const numeric = Number.parseInt(`${value}`, 10);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return fallback;
};

export const loadAppConfig = (): AppConfig => {
  const env =
    (process.env.NODE_ENV as AppConfig["env"] | undefined) ?? "development";
  const defaultInstallDir =
    process.env.EXTENSIONS_INSTALL_DIR ??
    "resources/extensions"; // Overridden by installer when running inside Electron

  const defaultCatalogPath =
    process.env.CATALOG_REPO_URL ??
    path.join(process.cwd(), "resources", "catalog", "default", "index.json");

  return {
    env,
    catalog: {
      defaultRepoId: process.env.CATALOG_REPO_ID ?? "local-catalog",
      defaultRepoName: process.env.CATALOG_REPO_NAME ?? "Local Catalog",
      defaultRepoUrl: defaultCatalogPath,
      cacheTtlSeconds: parseNumber(process.env.CATALOG_CACHE_TTL, 60 * 60),
      drivers: ["http", "filesystem"],
    },
    extensions: {
      installDir: defaultInstallDir,
      bundleDir:
        process.env.EXTENSIONS_BUNDLE_DIR ?? "resources/extensions/bundles",
      runtime: {
        timeoutMs: parseNumber(process.env.EXT_RUNTIME_TIMEOUT, 10_000),
        maxHeapMb: parseNumber(process.env.EXT_RUNTIME_HEAP, 128),
      },
    },
    installer: {
      concurrency: parseNumber(process.env.INSTALLER_CONCURRENCY, 1),
      tempDir: process.env.INSTALLER_TEMP_DIR ?? "temp/extensions",
      verifySignatures: parseBoolean(
        process.env.INSTALLER_VERIFY_SIGNATURES,
        true,
      ),
    },
    sandbox: {
      allowNetworkHosts:
        process.env.SANDBOX_NET_ALLOWLIST?.split(",").map((host) =>
          host.trim(),
        ) ?? [],
    },
    settings: {
      tableName: "settings",
    },
  };
};
