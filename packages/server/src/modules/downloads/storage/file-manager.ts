import { existsSync, mkdirSync } from "node:fs";
import {
  mkdir,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export interface FileManagerOptions {
  baseDir?: string;
}

export interface SaveImageResult {
  filePath: string;
  fileSize: number;
}

export interface StorageStats {
  totalBytes: number;
  downloadCount: number;
}

const padPage = (pageNumber: number): string =>
  pageNumber.toString().padStart(3, "0");

const getDefaultBaseDir = (): string => {
  if (process.env.DOWNLOADS_DIR) {
    return path.resolve(process.env.DOWNLOADS_DIR);
  }
  const dataDir =
    process.env.DB_PATH ?? path.join(process.cwd(), "data");
  return path.join(dataDir, "downloads");
};

const normalizeExtension = (extension?: string): string => {
  if (!extension) {
    return ".jpg";
  }
  const safe = extension.startsWith(".") ? extension : `.${extension}`;
  if (/^\.[a-z0-9]+$/i.test(safe)) {
    return safe.toLowerCase();
  }
  return ".jpg";
};

export class DownloadFileManager {
  private readonly baseDir: string;

  constructor(options?: FileManagerOptions) {
    this.baseDir = options?.baseDir
      ? path.resolve(options.baseDir)
      : getDefaultBaseDir();

    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  getDownloadDir(downloadId: string): string {
    return path.join(this.baseDir, downloadId);
  }

  async saveImage(
    buffer: Buffer,
    downloadId: string,
    pageNumber: number,
    extension?: string,
  ): Promise<SaveImageResult> {
    const downloadDir = this.getDownloadDir(downloadId);
    await mkdir(downloadDir, { recursive: true });

    const fileName = `page_${padPage(pageNumber)}${normalizeExtension(extension)}`;
    const filePath = path.join(downloadDir, fileName);

    await writeFile(filePath, buffer);
    const fileStat = await stat(filePath);

    return {
      filePath,
      fileSize: fileStat.size,
    };
  }

  async getImagePath(
    downloadId: string,
    pageNumber: number,
  ): Promise<string | null> {
    try {
      const downloadDir = this.getDownloadDir(downloadId);
      const entries = await readdir(downloadDir);
      const prefix = `page_${padPage(pageNumber)}`;
      const match = entries.find((file) => file.startsWith(prefix));
      if (!match) {
        return null;
      }
      return path.join(downloadDir, match);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return null;
      }
      throw error;
    }
  }

  async deleteDownload(downloadId: string): Promise<void> {
    const downloadDir = this.getDownloadDir(downloadId);
    await rm(downloadDir, { recursive: true, force: true });
  }

  async getStorageStats(): Promise<StorageStats> {
    try {
      const entries = await readdir(this.baseDir, {
        withFileTypes: true,
      });
      let totalBytes = 0;
      let downloadCount = 0;

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        downloadCount += 1;
        const downloadDir = path.join(this.baseDir, entry.name);
        const files = await readdir(downloadDir, {
          withFileTypes: true,
        });

        for (const file of files) {
          if (!file.isFile()) {
            continue;
          }
          const filePath = path.join(downloadDir, file.name);
          const fileStat = await stat(filePath);
          totalBytes += fileStat.size;
        }
      }

      return { totalBytes, downloadCount };
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { totalBytes: 0, downloadCount: 0 };
      }
      throw error;
    }
  }
}

export const createDownloadFileManager = (
  options?: FileManagerOptions,
): DownloadFileManager => {
  return new DownloadFileManager(options);
};

