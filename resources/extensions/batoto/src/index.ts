import type {
  ExtensionContext,
  Chapter,
  ChapterPayload,
  ExtensionModule,
  Manga,
  MangaDetailsPayload,
  MangaDetailsResult,
  MangaSearchResult,
  NormalizedSortField,
  SearchPayload,
} from "@jamra/contracts";
import {
  createSearchController,
  defineExtensionManifest,
  runLimited,
} from "../../../../packages/server/src/sdk/index.ts";
import manifestJson from "../manifest.json" with { type: "json" };
import {
  BROWSE_SORTS,
  CHAPTER_FILTERS,
  RELEASE_FILTERS,
  BatoToClient,
  createDefaultBrowseFilters,
  labelForSortParam,
  mapLanguageToBatoParam,
  resolveSortParam,
  type BrowseFilters,
} from "./client.ts";

type ExtensionMode = "browse" | "search";

interface NormalizedFilters extends Record<string, unknown> {
  browse: BrowseFilters;
}

const manifest = defineExtensionManifest(manifestJson);
const MAX_SEARCH_METADATA_HYDRATIONS = 10;
const SEARCH_HYDRATION_CONCURRENCY = 3;

const searchController = createSearchController<
  ExtensionMode,
  NormalizedFilters
>({
  modes: ["browse", "search"],
  defaultMode: "browse",
  hotMode: "browse",
  searchMode: "search",
  initialState: () => ({
    browse: createDefaultBrowseFilters(),
  }),
  filters: [
    {
      key: "browse.sort",
      kind: "enum",
      values: BROWSE_SORTS,
      default: "views_m.za",
      aliases: ["sort"],
    },
    {
      key: "browse.release",
      kind: "enum",
      values: RELEASE_FILTERS,
      aliases: ["release"],
    },
    {
      key: "browse.chapters",
      kind: "enum",
      values: CHAPTER_FILTERS,
      aliases: ["chapters"],
    },
    {
      key: "browse.includeGenres",
      kind: "string[]",
      aliases: ["include_genres", "includedGenres"],
    },
    {
      key: "browse.excludeGenres",
      kind: "string[]",
      aliases: ["exclude_genres", "excludedGenres"],
    },
    {
      key: "browse.includeLanguages",
      kind: "string[]",
      aliases: ["include_languages", "includedLanguages"],
    },
    {
      key: "browse.excludeLanguages",
      kind: "string[]",
      aliases: ["exclude_languages", "excludedLanguages"],
    },
    {
      key: "browse.includeOriginals",
      kind: "string[]",
      aliases: ["include_originals", "includedOriginals"],
    },
    {
      key: "browse.excludeOriginals",
      kind: "string[]",
      aliases: ["exclude_originals", "excludedOriginals"],
    },
  ],
  finalize: (state) => {
    return {
      browse: {
        ...createDefaultBrowseFilters(),
        ...state.browse,
        sortLabel: labelForSortParam(state.browse.sort),
      },
    };
  },
});

const extension = {
  manifest,

  async init(context) {
    context.logger.info("Bato.to extension ready");
  },

  async search(payload: SearchPayload, context): Promise<MangaSearchResult> {
    const trimmedQuery = payload.query?.trim() ?? "";
    const searchState = searchController.normalize(
      payload.filters,
      trimmedQuery,
    );
    const client = new BatoToClient(context);
    const page = payload.page ?? 1;
    const normalizedLanguage = payload.normalizedFilters?.language;
    const siteLanguage = mapLanguageToBatoParam(normalizedLanguage);
    const normalizedSort = payload.normalizedFilters?.sort;
    const rawLanguage = extractRawLanguage(payload.rawFilters);

    const browseFilters = cloneBrowseFilters(searchState.filters.browse);
    if (siteLanguage) {
      browseFilters.includeLanguages = [siteLanguage];
    }
    if (normalizedSort) {
      const resolved = resolveSortParam(normalizedSort);
      if (resolved) {
        browseFilters.sort = resolved.sortParam;
        browseFilters.sortLabel = resolved.label;
      }
    } else if (!browseFilters.sortLabel) {
      browseFilters.sortLabel = resolvedSortLabel(browseFilters.sort);
    }

    const requestedCount = parseCount(payload.filters?.count);

    if (searchState.mode === "search" && trimmedQuery.length > 0) {
      const response = await client.searchCatalog(trimmedQuery, page, {
        language: siteLanguage,
        canonicalLanguage: normalizedLanguage,
        canonicalSort: normalizedSort?.field,
        rawLanguage,
        skipLanguageFilter: Boolean(siteLanguage),
      });
      await hydrateSearchMetadata(response.results, client, context);
      return finalizeResponse(response, normalizedLanguage, requestedCount);
    }

    const response = await client.browseCatalog(page, browseFilters, {
      language: siteLanguage,
      canonicalLanguage: normalizedLanguage,
      canonicalSort: browseFilters.sortLabel,
      rawLanguage,
      skipLanguageFilter: Boolean(siteLanguage),
    });
    return finalizeResponse(response, normalizedLanguage, requestedCount);
  },

  async getMangaDetails(
    payload: MangaDetailsPayload,
    context,
  ): Promise<MangaDetailsResult> {
    const client = new BatoToClient(context);
    return client.getSeriesDetails(payload.mangaId, {
      includeChapters: payload.includeChapters !== false,
    });
  },

  async getChapters(
    payload: MangaDetailsPayload,
    context,
  ): Promise<Chapter[]> {
    const client = new BatoToClient(context);
    return client.getChapters(payload.mangaId);
  },

  async getPages(payload: ChapterPayload, context) {
    const client = new BatoToClient(context);
    const pages = await client.getPages(payload.mangaId, payload.chapterId);
    return { pages };
  },
} satisfies ExtensionModule;

const cloneBrowseFilters = (filters: BrowseFilters): BrowseFilters => {
  return {
    ...filters,
    sortLabel: filters.sortLabel,
    includeGenres: [...filters.includeGenres],
    excludeGenres: [...filters.excludeGenres],
    includeLanguages: [...filters.includeLanguages],
    excludeLanguages: [...filters.excludeLanguages],
    includeOriginals: [...filters.includeOriginals],
    excludeOriginals: [...filters.excludeOriginals],
  };
};

const resolvedSortLabel = (
  sort: BrowseFilters["sort"],
): NormalizedSortField => {
  return labelForSortParam(sort);
};

const hydrateSearchMetadata = async (
  items: Manga[],
  client: BatoToClient,
  context: ExtensionContext,
): Promise<void> => {
  const targets = items.filter(
    (manga) => !manga.authors || manga.authors.length === 0,
  );
  if (targets.length === 0) {
    return;
  }
  const slice = targets.slice(0, MAX_SEARCH_METADATA_HYDRATIONS);
  await runLimited(slice, SEARCH_HYDRATION_CONCURRENCY, async (manga) => {
    try {
      const details = await client.getSeriesDetails(manga.id, {
        includeChapters: false,
      });
      if (!manga.authors?.length && details.manga.authors?.length) {
        manga.authors = [...details.manga.authors];
      }
      if (!manga.artists?.length && details.manga.artists?.length) {
        manga.artists = [...details.manga.artists];
      }
    } catch (error) {
      context.logger.warn("Failed to hydrate search metadata", {
        mangaId: manga.id,
        error: error instanceof Error ? error.message : error,
      });
    }
  });
};

const finalizeResponse = (
  response: MangaSearchResult,
  language?: string,
  limit?: number,
): MangaSearchResult => {
  const normalized = language
    ? {
        ...response,
        results: response.results.map((result) => ({
          ...result,
          language,
        })),
      }
    : response;

  if (!limit || limit >= normalized.results.length) {
    return normalized;
  }

  return {
    hasMore: true,
    results: normalized.results.slice(0, limit),
    totalResults: normalized.totalResults,
  };
};

const parseCount = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampCount(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return clampCount(parsed);
    }
  }
  return undefined;
};

const clampCount = (value: number): number | undefined => {
  if (value <= 0) {
    return undefined;
  }
  return Math.min(value, 120);
};

const extractRawLanguage = (
  rawFilters?: Record<string, unknown>,
): string | undefined => {
  if (!rawFilters) {
    return undefined;
  }
  const keys = [
    "lang",
    "language",
    "languages",
    "translatedLanguage",
    "tl",
  ];
  for (const key of keys) {
    const value = rawFilters[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
};

export default extension;
