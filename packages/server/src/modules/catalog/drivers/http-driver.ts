import { ValidationError } from "../../../shared/errors.js";
import type {
  CatalogDriver,
  CatalogDriverContext,
  CatalogEntry,
  CatalogRepoSource,
} from "../catalog.types.js";
import type { HttpClient } from "../../../shared/http/http-client.js";

interface RemoteCatalogEntry {
  id: string;
  slug?: string;
  name: string;
  version?: string;
  description?: string;
  iconUrl?: string;
  archiveUrl: string;
  checksum?: string;
  language?: string;
}

interface RemoteCatalogResponse {
  entries: RemoteCatalogEntry[];
  checksum?: string;
}

export class HttpCatalogDriver implements CatalogDriver {
  readonly name = "http";

  constructor(private readonly httpClient: HttpClient) {}

  canHandle(repo: CatalogRepoSource): boolean {
    return repo.type === "http";
  }

  async fetchIndex(
    context: CatalogDriverContext,
  ): Promise<{ entries: CatalogEntry[]; checksum?: string }> {
    const payload = await this.httpClient.get<RemoteCatalogResponse>(
      context.repo.url,
    );
    if (!payload || !Array.isArray(payload.entries)) {
      throw new ValidationError(
        `Invalid catalog payload from ${context.repo.url}`,
      );
    }

    const now = new Date();
    const entries: CatalogEntry[] = payload.entries.map((entry) => ({
      id: entry.id,
      slug: entry.slug ?? entry.id,
      name: entry.name,
      version: entry.version ?? "0.0.0",
      iconUrl: entry.iconUrl,
      archiveUrl: entry.archiveUrl,
      checksum: entry.checksum,
      language: entry.language,
      description: entry.description,
      repoId: context.repo.id,
      createdAt: now,
      updatedAt: now,
    }));

    return { entries, checksum: payload.checksum };
  }

  async healthcheck(context: CatalogDriverContext): Promise<boolean> {
    try {
      await this.httpClient.head(context.repo.url);
      return true;
    } catch {
      return false;
    }
  }
}
