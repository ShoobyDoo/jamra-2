import type { AppConfig } from "../../core/config/app-config.js";
import type {
  CatalogDriver,
  CatalogEntry,
  CatalogRepoSource,
  CatalogSyncResult,
} from "./catalog.types.js";
import type { CatalogRepository } from "./catalog.types.js";
import { ValidationError } from "../../shared/errors.js";

export class CatalogService {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly drivers: CatalogDriver[],
    private readonly config: AppConfig["catalog"],
  ) {}

  listEntries(repoId?: string): CatalogEntry[] {
    return this.repository.listEntries(repoId);
  }

  async syncCatalog(repoId?: string): Promise<CatalogSyncResult> {
    const repo = this.ensureRepo(repoId);
    const driver = this.drivers.find((candidate) => candidate.canHandle(repo));
    if (!driver) {
      throw new ValidationError(
        `No catalog driver available for repo type: ${repo.type}`,
      );
    }

    const beforeEntries = new Set(
      this.repository.listEntries(repo.id).map((entry) => entry.id),
    );

    const { entries, checksum } = await driver.fetchIndex({
      repo,
      db: undefined,
    });

    const syncedAt = new Date();
    const normalized = entries.map((entry) => ({
      ...entry,
      repoId: repo.id,
      createdAt: entry.createdAt ?? syncedAt,
      updatedAt: syncedAt,
    }));

    this.repository.upsertRepo({
      ...repo,
      checksum,
      lastSyncedAt: syncedAt,
    });
    this.repository.upsertEntries(repo.id, normalized);

    const keepIds = normalized.map((entry) => entry.id);
    const removedIds = [...beforeEntries].filter((id) => !keepIds.includes(id));
    this.repository.deleteMissingEntries(repo.id, keepIds);

    const updatedRepo = this.repository.getRepo(repo.id) ?? {
      ...repo,
      checksum,
      lastSyncedAt: syncedAt,
    };

    return {
      repo: updatedRepo,
      entriesUpdated: normalized.length,
      entriesRemoved: removedIds.length,
      checksum,
    };
  }

  private ensureRepo(repoId?: string): CatalogRepoSource {
    if (repoId) {
      const existing = this.repository.getRepo(repoId);
      if (!existing) {
        throw new ValidationError(`Catalog repo ${repoId} was not found`);
      }
      return existing;
    }

    const defaultRepoId = this.config.defaultRepoId;
    const existingDefault = this.repository.getRepo(defaultRepoId);
    if (existingDefault) {
      return existingDefault;
    }

    const repoType = this.inferRepoType(this.config.defaultRepoUrl);
    const repo: CatalogRepoSource = {
      id: defaultRepoId,
      name: this.config.defaultRepoName,
      url: this.config.defaultRepoUrl,
      type: repoType,
    };
    this.repository.upsertRepo(repo);
    return repo;
  }

  private inferRepoType(url: string): "http" | "filesystem" {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return "http";
    }
    return "filesystem";
  }
}

export interface CatalogServiceFactoryArgs {
  repository: CatalogRepository;
  drivers: CatalogDriver[];
  config: AppConfig["catalog"];
}

export const createCatalogService = (
  args: CatalogServiceFactoryArgs,
): CatalogService => {
  return new CatalogService(args.repository, args.drivers, args.config);
};
