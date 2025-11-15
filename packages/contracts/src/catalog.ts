export interface CatalogRepoSource {
  id: string;
  name: string;
  url: string;
  type: "http" | "filesystem";
  checksum?: string;
  lastSyncedAt?: string;
}

export interface CatalogEntry {
  id: string;
  repoId: string;
  slug: string;
  name: string;
  version: string;
  iconUrl?: string;
  archiveUrl: string;
  checksum?: string;
  language?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogSyncResult {
  repo: CatalogRepoSource;
  entriesUpdated: number;
  entriesRemoved: number;
  checksum?: string;
}
