import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { ValidationError } from "../../../shared/errors.js";
import type {
  CatalogDriver,
  CatalogDriverContext,
  CatalogEntry,
  CatalogRepoSource,
} from "../catalog.types.js";

interface FilesystemCatalogEntry {
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

interface FilesystemCatalogPayload {
  entries: FilesystemCatalogEntry[];
  checksum?: string;
}

const ensureJsonPath = (repoPath: string): string => {
  let resolved = repoPath;
  try {
    const stats = statSync(repoPath);
    if (stats.isDirectory()) {
      resolved = path.join(repoPath, "index.json");
    }
  } catch (error) {
    throw new ValidationError(
      `Catalog file not found at ${repoPath}: ${String(error)}`,
    );
  }
  return resolved;
};

const resolveAbsolutePath = (url: string): string => {
  if (path.isAbsolute(url)) {
    return url;
  }
  return path.resolve(process.cwd(), url);
};

export class FilesystemCatalogDriver implements CatalogDriver {
  readonly name = "filesystem";

  canHandle(repo: CatalogRepoSource): boolean {
    return repo.type === "filesystem";
  }

  async fetchIndex(
    context: CatalogDriverContext,
  ): Promise<{ entries: CatalogEntry[]; checksum?: string }> {
    const absolutePath = ensureJsonPath(resolveAbsolutePath(context.repo.url));

    const payload = JSON.parse(
      readFileSync(absolutePath, "utf-8"),
    ) as FilesystemCatalogPayload;

    if (!Array.isArray(payload.entries)) {
      throw new ValidationError(
        `Catalog file at ${absolutePath} does not contain an entries array`,
      );
    }

    const catalogDir = path.dirname(absolutePath);
    const now = new Date();
    const entries: CatalogEntry[] = payload.entries.map((entry) => {
      const archiveUrl = this.resolveArchiveUrl(entry.archiveUrl, catalogDir);
      return {
        id: entry.id,
        slug: entry.slug ?? entry.id,
        name: entry.name,
        version: entry.version ?? "0.0.0",
        iconUrl: entry.iconUrl
          ? this.resolveArchiveUrl(entry.iconUrl, catalogDir)
          : undefined,
        archiveUrl,
        checksum: entry.checksum,
        language: entry.language,
        description: entry.description,
        repoId: context.repo.id,
        createdAt: now,
        updatedAt: now,
      };
    });

    return { entries, checksum: payload.checksum };
  }

  private resolveArchiveUrl(target: string, baseDir: string): string {
    if (target.startsWith("http://") || target.startsWith("https://")) {
      return target;
    }
    if (path.isAbsolute(target)) {
      return target;
    }
    return path.resolve(baseDir, target);
  }
}
