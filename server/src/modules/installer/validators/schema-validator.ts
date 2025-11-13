import { ValidationError } from "../../../shared/errors.js";
import type {
  ExtensionRepositoryIndex,
  RepositoryInfo,
  ExtensionMetadata,
  SchemaVersion,
  ExtensionLanguage,
} from "../types/repository-schema.types.js";
import {
  SUPPORTED_SCHEMA_VERSIONS,
  SUPPORTED_LANGUAGES,
} from "../types/repository-schema.types.js";

/**
 * Validate repository index data against strict schema
 * Rejects any unknown keys at any level
 */
export const validateRepositoryIndex = (
  data: unknown,
): ExtensionRepositoryIndex => {
  // 1. Check data is an object
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError(
      "Invalid repository index: must be an object",
    );
  }

  // 2. Check for unknown keys at root level
  const allowedRootKeys = ["version", "repository", "extensions"];
  const actualKeys = Object.keys(data);
  const unknownKeys = actualKeys.filter((k) => !allowedRootKeys.includes(k));

  if (unknownKeys.length > 0) {
    throw new ValidationError(
      `Unknown keys in repository index: ${unknownKeys.join(", ")}`,
    );
  }

  // 3. Extract fields
  const { version, repository, extensions } = data as Record<string, unknown>;

  // 4. Validate version field
  if (!version || typeof version !== "string") {
    throw new ValidationError(
      "Invalid or missing version field: must be a string",
    );
  }

  // 5. Check schema version compatibility
  const schemaVersion = version as SchemaVersion;
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion)) {
    throw new ValidationError(
      `Unsupported schema version: ${version}. Supported versions: ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}`,
    );
  }

  // 6. Validate repository object
  const validatedRepository = validateRepositoryObject(repository);

  // 7. Validate extensions array
  const validatedExtensions = validateExtensionsArray(extensions);

  return {
    version,
    repository: validatedRepository,
    extensions: validatedExtensions,
  };
};

/**
 * Validate repository information object
 */
const validateRepositoryObject = (repo: unknown): RepositoryInfo => {
  if (!repo || typeof repo !== "object" || Array.isArray(repo)) {
    throw new ValidationError(
      "Invalid repository field: must be an object",
    );
  }

  // Check for unknown keys
  const allowedKeys = ["name", "url", "author", "description"];
  const actualKeys = Object.keys(repo);
  const unknownKeys = actualKeys.filter((k) => !allowedKeys.includes(k));

  if (unknownKeys.length > 0) {
    throw new ValidationError(
      `Unknown keys in repository object: ${unknownKeys.join(", ")}`,
    );
  }

  const { name, url, author, description } = repo as Record<string, unknown>;

  // Validate required string fields
  if (!name || typeof name !== "string") {
    throw new ValidationError(
      "Invalid or missing repository.name: must be a string",
    );
  }

  if (!url || typeof url !== "string") {
    throw new ValidationError(
      "Invalid or missing repository.url: must be a string",
    );
  }

  if (!author || typeof author !== "string") {
    throw new ValidationError(
      "Invalid or missing repository.author: must be a string",
    );
  }

  if (!description || typeof description !== "string") {
    throw new ValidationError(
      "Invalid or missing repository.description: must be a string",
    );
  }

  // Validate URL format
  validateUrl(url, "repository.url");

  return { name, url, author, description };
};

/**
 * Validate extensions array
 */
const validateExtensionsArray = (
  extensions: unknown,
): ExtensionMetadata[] => {
  if (!Array.isArray(extensions)) {
    throw new ValidationError(
      "Invalid extensions field: must be an array",
    );
  }

  if (extensions.length === 0) {
    throw new ValidationError(
      "Extensions array cannot be empty",
    );
  }

  return extensions.map((ext, index) => validateExtensionObject(ext, index));
};

/**
 * Validate individual extension metadata object
 */
const validateExtensionObject = (
  ext: unknown,
  index: number,
): ExtensionMetadata => {
  if (!ext || typeof ext !== "object" || Array.isArray(ext)) {
    throw new ValidationError(
      `Invalid extension at index ${index}: must be an object`,
    );
  }

  // Check for unknown keys
  const allowedKeys = [
    "id",
    "name",
    "version",
    "author",
    "description",
    "language",
    "entrypoint",
    "sourceUrl",
    "dependencies",
  ];
  const actualKeys = Object.keys(ext);
  const unknownKeys = actualKeys.filter((k) => !allowedKeys.includes(k));

  if (unknownKeys.length > 0) {
    throw new ValidationError(
      `Unknown keys in extension[${index}]: ${unknownKeys.join(", ")}`,
    );
  }

  const {
    id,
    name,
    version,
    author,
    description,
    language,
    entrypoint,
    sourceUrl,
    dependencies,
  } = ext as Record<string, unknown>;

  // Validate required string fields
  if (!id || typeof id !== "string") {
    throw new ValidationError(
      `Invalid or missing extension[${index}].id: must be a string`,
    );
  }

  if (!name || typeof name !== "string") {
    throw new ValidationError(
      `Invalid or missing extension[${index}].name: must be a string`,
    );
  }

  if (!version || typeof version !== "string") {
    throw new ValidationError(
      `Invalid or missing extension[${index}].version: must be a string`,
    );
  }

  if (!author || typeof author !== "string") {
    throw new ValidationError(
      `Invalid or missing extension[${index}].author: must be a string`,
    );
  }

  if (!description || typeof description !== "string") {
    throw new ValidationError(
      `Invalid or missing extension[${index}].description: must be a string`,
    );
  }

  if (!language || typeof language !== "string") {
    throw new ValidationError(
      `Invalid or missing extension[${index}].language: must be a string`,
    );
  }

  if (!entrypoint || typeof entrypoint !== "string") {
    throw new ValidationError(
      `Invalid or missing extension[${index}].entrypoint: must be a string`,
    );
  }

  if (!sourceUrl || typeof sourceUrl !== "string") {
    throw new ValidationError(
      `Invalid or missing extension[${index}].sourceUrl: must be a string`,
    );
  }

  // Validate language enum
  const extensionLanguage = language as ExtensionLanguage;
  if (!SUPPORTED_LANGUAGES.includes(extensionLanguage)) {
    throw new ValidationError(
      `Invalid extension[${index}].language: must be one of ${SUPPORTED_LANGUAGES.join(", ")}`,
    );
  }

  // Validate semver format
  validateSemver(version, `extension[${index}].version`);

  // Validate URLs
  validateUrl(sourceUrl, `extension[${index}].sourceUrl`);

  // Validate dependencies (optional)
  let validatedDependencies: Record<string, string> | undefined;
  if (dependencies !== undefined) {
    if (
      typeof dependencies !== "object" ||
      Array.isArray(dependencies) ||
      dependencies === null
    ) {
      throw new ValidationError(
        `Invalid extension[${index}].dependencies: must be an object`,
      );
    }

    // Validate all keys and values are strings
    const depEntries = Object.entries(dependencies);
    for (const [key, value] of depEntries) {
      if (typeof key !== "string" || typeof value !== "string") {
        throw new ValidationError(
          `Invalid extension[${index}].dependencies: all keys and values must be strings`,
        );
      }
    }

    validatedDependencies = dependencies as Record<string, string>;
  }

  return {
    id,
    name,
    version,
    author,
    description,
    language: extensionLanguage,
    entrypoint,
    sourceUrl,
    dependencies: validatedDependencies,
  };
};

/**
 * Validate semver format (simple regex check)
 */
const validateSemver = (version: string, fieldName: string): void => {
  // Simple semver regex: X.Y.Z where X, Y, Z are numbers
  const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;

  if (!semverRegex.test(version)) {
    throw new ValidationError(
      `Invalid ${fieldName}: must be valid semver format (e.g., "1.0.0")`,
    );
  }
};

/**
 * Validate URL format (basic check)
 */
const validateUrl = (url: string, fieldName: string): void => {
  try {
    new URL(url);
  } catch (_error) {
    throw new ValidationError(
      `Invalid ${fieldName}: must be a valid URL`,
    );
  }
};
