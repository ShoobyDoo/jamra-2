/**
 * TypeScript types for extension repository index files
 * Schema version: 1.0
 */

/**
 * Repository information metadata
 */
export interface RepositoryInfo {
  name: string;
  url: string;
  author: string;
  description: string;
}

/**
 * Extension metadata from repository index
 */
export interface ExtensionMetadata {
  id: string;
  name: string;
  version: string; // Semver format (e.g., "1.0.0")
  author: string;
  description: string;
  language: "typescript" | "javascript";
  entrypoint: string; // Path to main file (e.g., "src/index.ts")
  sourceUrl: string; // Raw URL to extension folder
  dependencies?: Record<string, string>; // npm dependencies
}

/**
 * Complete repository index structure
 */
export interface ExtensionRepositoryIndex {
  version: string; // Schema version (e.g., "1.0")
  repository: RepositoryInfo;
  extensions: ExtensionMetadata[];
}

/**
 * Supported schema versions
 */
export const SUPPORTED_SCHEMA_VERSIONS = ["1.0"] as const;

/**
 * Supported extension languages
 */
export const SUPPORTED_LANGUAGES = ["typescript", "javascript"] as const;

export type SchemaVersion = (typeof SUPPORTED_SCHEMA_VERSIONS)[number];
export type ExtensionLanguage = (typeof SUPPORTED_LANGUAGES)[number];
