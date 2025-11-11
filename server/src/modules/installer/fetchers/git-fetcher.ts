import type { HttpClient } from "../../../shared/http/http-client.js";
import { ValidationError, DomainError } from "../../../shared/errors.js";
import { validateRepositoryIndex } from "../validators/schema-validator.js";
import type { ExtensionRepositoryIndex } from "../types/repository-schema.types.js";

/**
 * Fetches extension repository index files from Git platforms
 * Supports: GitHub, GitLab, Bitbucket
 */
export class GitRepositoryFetcher {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Fetch and validate repository index.json from Git repository
   * @param gitUrl - Git repository URL (e.g., "https://github.com/user/repo")
   * @param branch - Branch name (default: "main")
   * @returns Validated repository index
   */
  async fetchRepositoryIndex(
    gitUrl: string,
    branch: string = "main",
  ): Promise<ExtensionRepositoryIndex> {
    // 1. Normalize Git URL to raw URL for index.json
    const rawUrl = this.normalizeToRawUrl(gitUrl, branch);

    try {
      // 2. Fetch index.json with timeout
      const response = await this.httpClient.get<string>(rawUrl, {
        timeoutMs: 10000,
        headers: {
          "User-Agent": "JAMRA-Extension-Installer",
        },
      });

      // 3. Parse JSON
      let data: unknown;
      try {
        data = JSON.parse(response);
      } catch (error) {
        throw new ValidationError(
          "Invalid JSON in index.json: " +
            (error instanceof Error ? error.message : "Unknown parse error"),
        );
      }

      // 4. Validate against schema
      return validateRepositoryIndex(data);
    } catch (error) {
      // Re-throw ValidationError as-is
      if (error instanceof ValidationError) {
        throw error;
      }

      // Wrap other errors in DomainError
      if (error instanceof Error) {
        // Check for 404 specifically
        if (error.message.includes("404")) {
          throw new ValidationError(
            `index.json not found in repository at ${rawUrl}`,
          );
        }

        throw new DomainError(
          `Failed to fetch repository index: ${error.message}`,
        );
      }

      throw new DomainError(
        "Failed to fetch repository index: Unknown error",
      );
    }
  }

  /**
   * Normalize Git repository URL to raw URL for index.json
   * Supports GitHub, GitLab, and Bitbucket
   */
  private normalizeToRawUrl(gitUrl: string, branch: string): string {
    // Remove trailing slashes and .git suffix
    let cleanUrl = gitUrl.trim().replace(/\.git$/, "").replace(/\/$/, "");

    // Remove protocol if present for easier parsing
    const hasProtocol = /^https?:\/\//.test(cleanUrl);
    if (hasProtocol) {
      cleanUrl = cleanUrl.replace(/^https?:\/\//, "");
    }

    // Determine platform and convert to raw URL
    if (cleanUrl.startsWith("github.com/")) {
      // GitHub: github.com/user/repo → raw.githubusercontent.com/user/repo/main/index.json
      const path = cleanUrl.replace("github.com/", "");
      return `https://raw.githubusercontent.com/${path}/${branch}/index.json`;
    } else if (cleanUrl.startsWith("gitlab.com/")) {
      // GitLab: gitlab.com/user/repo → gitlab.com/user/repo/-/raw/main/index.json
      const path = cleanUrl.replace("gitlab.com/", "");
      return `https://gitlab.com/${path}/-/raw/${branch}/index.json`;
    } else if (cleanUrl.startsWith("bitbucket.org/")) {
      // Bitbucket: bitbucket.org/user/repo → bitbucket.org/user/repo/raw/main/index.json
      const path = cleanUrl.replace("bitbucket.org/", "");
      return `https://bitbucket.org/${path}/raw/${branch}/index.json`;
    }

    throw new ValidationError(
      `Unsupported Git platform. URL must be from github.com, gitlab.com, or bitbucket.org. Received: ${gitUrl}`,
    );
  }
}

/**
 * Factory function to create GitRepositoryFetcher
 */
export const createGitRepositoryFetcher = (
  httpClient: HttpClient,
): GitRepositoryFetcher => {
  return new GitRepositoryFetcher(httpClient);
};
