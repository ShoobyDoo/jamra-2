import type Database from "better-sqlite3";
import type { AppContext } from "../../app/context.js";

export interface CatalogRepoSource {
  id: string;
  name: string;
  url: string;
  type: "http" | "filesystem";
  checksum?: string;
  lastSyncedAt?: Date;
}

export interface CatalogEntry {
  id: string;
  slug: string;
  name: string;
  version: string;
  iconUrl?: string;
  archiveUrl: string;
  checksum?: string;
  language?: string;
  description?: string;
  repoId: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface CatalogRepository {
  listEntries(repoId?: string): CatalogEntry[];
  listRepos(): CatalogRepoSource[];
  getRepo(repoId: string): CatalogRepoSource | null;
  upsertRepo(repo: CatalogRepoSource): void;
  upsertEntries(repoId: string, entries: CatalogEntry[]): void;
  deleteMissingEntries(repoId: string, keepIds: string[]): void;
}

export interface CatalogDriverContext {
  db?: Database.Database;
  repo: CatalogRepoSource;
}

export interface CatalogDriver {
  readonly name: string;
  canHandle(repo: CatalogRepoSource): boolean;
  fetchIndex(
    context: CatalogDriverContext,
  ): Promise<{ entries: CatalogEntry[]; checksum?: string }>;
  healthcheck?(context: CatalogDriverContext): Promise<boolean>;
}

export interface CatalogSyncResult {
  repo: CatalogRepoSource;
  entriesUpdated: number;
  entriesRemoved: number;
  checksum?: string;
}

export interface CatalogModuleContext extends AppContext {
  drivers: CatalogDriver[];
}
