import type { HttpClient } from "../../../shared/http/http-client.js";
import { DomainError, ValidationError } from "../../../shared/errors.js";
import type { ExtensionMetadata } from "../types/repository-schema.types.js";

/**
 * Individual source file
 */
export interface SourceFile {
  path: string; // Relative path (e.g., "src/index.ts")
  content: string; // File content
}

/**
 * Fetches extension source code from remote repositories
 */
export class ExtensionSourceFetcher {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Fetch all source files for an extension
   * @param metadata - Extension metadata from repository index
   * @returns Map of file paths to file contents
   */
  async fetchExtensionSource(
    metadata: ExtensionMetadata,
  ): Promise<Map<string, string>> {
    const sourceFiles = new Map<string, string>();

    // 1. Build list of files to fetch
    const filesToFetch = this.buildFileList(metadata);

    // 2. Fetch each file
    for (const filePath of filesToFetch) {
      try {
        const url = `${metadata.sourceUrl}/${filePath}`;
        const content = await this.fetchFile(url);
        sourceFiles.set(filePath, content);
      } catch (error) {
        // If file is optional and not found, skip it
        const isOptional = this.isOptionalFile(filePath, metadata);
        if (isOptional && error instanceof ValidationError) {
          console.log(`Optional file not found, skipping: ${filePath}`);
          continue;
        }

        // Otherwise, re-throw the error
        throw error;
      }
    }

    // 3. Validate entrypoint was fetched
    if (!sourceFiles.has(metadata.entrypoint)) {
      throw new ValidationError(
        `Failed to fetch entrypoint file: ${metadata.entrypoint}`,
      );
    }

    return sourceFiles;
  }

  /**
   * Fetch a single file from URL
   */
  private async fetchFile(url: string): Promise<string> {
    try {
      const content = await this.httpClient.get<string>(url, {
        timeoutMs: 15000,
        headers: {
          "User-Agent": "JAMRA-Extension-Installer",
        },
      });

      return content;
    } catch (error) {
      if (error instanceof Error) {
        // Check for 404
        if (error.message.includes("404")) {
          throw new ValidationError(`File not found: ${url}`);
        }

        throw new DomainError(
          `Failed to fetch file from ${url}: ${error.message}`,
        );
      }

      throw new DomainError(`Failed to fetch file from ${url}: Unknown error`);
    }
  }

  /**
   * Build list of files to fetch for an extension
   */
  private buildFileList(metadata: ExtensionMetadata): string[] {
    const files: string[] = [];

    // 1. Always fetch the entrypoint
    files.push(metadata.entrypoint);

    // 2. Fetch package.json if dependencies exist
    if (metadata.dependencies && Object.keys(metadata.dependencies).length > 0) {
      files.push("package.json");
    }

    // 3. For TypeScript extensions, try to fetch tsconfig.json (optional)
    if (metadata.language === "typescript") {
      files.push("tsconfig.json");
    }

    // 4. Try to fetch manifest.json (optional, we'll create one if not present)
    files.push("manifest.json");

    return files;
  }

  /**
   * Check if a file is optional (can be missing)
   */
  private isOptionalFile(
    filePath: string,
    metadata: ExtensionMetadata,
  ): boolean {
    // Entrypoint is never optional
    if (filePath === metadata.entrypoint) {
      return false;
    }

    // package.json is optional if no dependencies
    if (filePath === "package.json") {
      return (
        !metadata.dependencies || Object.keys(metadata.dependencies).length === 0
      );
    }

    // tsconfig.json is always optional
    if (filePath === "tsconfig.json") {
      return true;
    }

    // manifest.json is optional (we can generate it)
    if (filePath === "manifest.json") {
      return true;
    }

    return false;
  }
}

/**
 * Factory function to create ExtensionSourceFetcher
 */
export const createExtensionSourceFetcher = (
  httpClient: HttpClient,
): ExtensionSourceFetcher => {
  return new ExtensionSourceFetcher(httpClient);
};
