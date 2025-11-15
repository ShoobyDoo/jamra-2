import type { ExtensionManifest } from "./extension-sdk.js";

export interface ExtensionRecord {
  id: string;
  slug: string;
  name: string;
  version: string;
  repoSource?: string;
  installPath: string;
  enabled: boolean;
  installedAt?: Date;
  checksum?: string;
  manifest: ExtensionManifest;
}
