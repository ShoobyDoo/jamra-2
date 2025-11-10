import type {
  NormalizedSearchFilters,
  NormalizedSortField,
} from "./extensions/filter-normalizer.js";

export type LocaleCode = string;

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  sourceUrl?: string;
  language: LocaleCode;
  entry: string;
  icon?: string;
  website?: string;
  tags?: string[];
  settingsSchema?: ExtensionSettingsSchema;
  minAppVersion?: string;
  checksum?: string;
  capabilities?: ExtensionCapabilities;
}

export interface ExtensionCapabilities {
  filters?: ExtensionFilterCapabilities;
}

export interface ExtensionFilterCapabilities {
  language?: boolean;
  contentRating?: boolean;
  status?: boolean;
  includeTags?: boolean;
  excludeTags?: boolean;
  sort?: NormalizedSortField[];
}

export type ExtensionSettingType =
  | "string"
  | "number"
  | "boolean"
  | "multi-select"
  | "select";

export interface ExtensionSettingOption {
  label: string;
  value: string;
}

export interface ExtensionSettingField<
  TType extends ExtensionSettingType = ExtensionSettingType,
> {
  key: string;
  label: string;
  description?: string;
  type: TType;
  default?: unknown;
  required?: boolean;
  options?: ExtensionSettingOption[];
}

export interface ExtensionSettingsSchema {
  version: number;
  fields: ExtensionSettingField[];
}

export interface ExtensionSettingsValues {
  [key: string]: unknown;
}

export interface ExtensionHttpRequestOptions {
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
  timeoutMs?: number;
}

export interface ExtensionHttpClient {
  get<T = unknown>(
    url: string,
    options?: ExtensionHttpRequestOptions,
  ): Promise<T>;
}

export interface ExtensionLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export interface ExtensionContext {
  settings: ExtensionSettingsValues;
  http: ExtensionHttpClient;
  logger: ExtensionLogger;
}

export interface Manga {
  id: string;
  title: string;
  alternateTitles?: string[];
  description?: string;
  coverUrl?: string;
  authors?: string[];
  artists?: string[];
  status?: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";
  tags?: string[];
  language: LocaleCode;
  sourceUrl?: string;
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber?: number;
  volume?: number;
  language: LocaleCode;
  publishedAt?: Date | string;
  scanlator?: string;
  pages?: number;
}

export interface Page {
  index: number;
  imageUrl: string;
  headers?: Record<string, string>;
  width?: number;
  height?: number;
}

export interface SearchPayload {
  query: string;
  page?: number;
  filters?: Record<string, unknown>;
  normalizedFilters?: NormalizedSearchFilters;
  rawFilters?: Record<string, unknown>;
}

export interface MangaDetailsPayload {
  mangaId: string;
  includeChapters?: boolean;
}

export interface ChapterPayload {
  mangaId: string;
  chapterId: string;
}

export interface MangaSearchResult {
  results: Manga[];
  hasMore: boolean;
  totalResults: number;
}

export interface MangaDetailsResult {
  manga: Manga;
  chapters: Chapter[];
}

export interface PagesResult {
  pages: Page[];
}

export interface ExtensionLifecycle {
  init?(context: ExtensionContext): Promise<void> | void;
  dispose?(context: ExtensionContext): Promise<void> | void;
}

export interface ExtensionModule extends ExtensionLifecycle {
  manifest: ExtensionManifest;
  search(
    payload: SearchPayload,
    context: ExtensionContext,
  ): Promise<MangaSearchResult>;
  getMangaDetails(
    payload: MangaDetailsPayload,
    context: ExtensionContext,
  ): Promise<MangaDetailsResult>;
  getChapters(
    payload: MangaDetailsPayload,
    context: ExtensionContext,
  ): Promise<Chapter[]>;
  getPages(
    payload: ChapterPayload,
    context: ExtensionContext,
  ): Promise<PagesResult>;
  getSettings?(
    current: ExtensionSettingsValues,
    context: ExtensionContext,
  ): Promise<ExtensionSettingsSchema | null>;
  onSettingsChange?(
    next: ExtensionSettingsValues,
    context: ExtensionContext,
  ): Promise<void>;
}

export const createExtension = (module: ExtensionModule): ExtensionModule => {
  return module;
};

export const defineSettings = (
  schema: ExtensionSettingsSchema,
): ExtensionSettingsSchema => schema;

export * from "./extensions/index.js";
