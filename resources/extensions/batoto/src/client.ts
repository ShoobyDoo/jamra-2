import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import type {
  Chapter,
  ExtensionContext,
  Manga,
  MangaDetailsResult,
  MangaSearchResult,
  NormalizedSort,
  NormalizedSortField,
  Page,
} from "@jamra/contracts";
import {
  ChapterListBuilder,
  CheerioExtractor,
  HtmlScraperClient,
  LanguageNormalizer,
  PagePipeline,
  SlugResolver,
  extractChapterNumber,
  normalizeSlug,
  normalizeStatusValue,
  toAbsoluteUrl as resolveAbsoluteUrl,
  extractSlugFromUrl as resolveSlugFromUrl,
  type ChapterSource,
} from "../../../../packages/server/src/sdk/index.ts";

const BASE_URL = "https://bato.to";
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: `${BASE_URL}/`,
};
const SEARCH_PATH = "/search";
const BROWSE_PATH = "/browse";
const SERIES_PATH_REGEX = /\/series\/(?<id>\d+)(?:\/(?<slug>[^/?#]+))?/i;
const CHAPTER_PATH_REGEX = /\/chapter\/(?<id>\d+)(?:\/(?<slug>[^/?#]+))?/i;
const DEFAULT_BROWSE_LIMIT = 60;
const SEARCH_RESULTS_PER_PAGE = 20;

export const BROWSE_SORTS = [
  "title.az",
  "update.za",
  "create.za",
  "views_a.za",
  "views_y.za",
  "views_m.za",
  "views_w.za",
  "views_d.za",
  "views_h.za",
] as const;

const SORT_RESOLUTION: Partial<Record<NormalizedSortField, BrowseSort>> = {
  alphabetical: "title.az",
  updated: "update.za",
  created: "create.za",
  views: "views_m.za",
  views_total: "views_a.za",
  views_year: "views_y.za",
  views_month: "views_m.za",
  views_week: "views_w.za",
  views_day: "views_d.za",
  views_hour: "views_h.za",
  subscriptions: "views_m.za",
  relevance: "views_m.za",
};
const DEFAULT_SORT_LABEL: NormalizedSortField = "views_month";

export const RELEASE_FILTERS = [
  "pending",
  "ongoing",
  "completed",
  "hiatus",
  "cancelled",
] as const;

export const CHAPTER_FILTERS = [
  "1-9",
  "10-29",
  "30-99",
  "100-199",
  "200",
  "100",
  "50",
  "10",
  "1",
] as const;

export type BrowseSort = (typeof BROWSE_SORTS)[number];
export type ReleaseFilter = (typeof RELEASE_FILTERS)[number];
export type ChapterRangeFilter = (typeof CHAPTER_FILTERS)[number];

export interface BrowseFilters {
  sort: BrowseSort;
  sortLabel?: NormalizedSortField;
  release?: ReleaseFilter;
  chapters?: ChapterRangeFilter;
  includeGenres: string[];
  excludeGenres: string[];
  includeLanguages: string[];
  excludeLanguages: string[];
  includeOriginals: string[];
  excludeOriginals: string[];
}

interface CatalogPagination {
  totalPages?: number;
}

interface CatalogResponse extends MangaSearchResult {
  pagination?: CatalogPagination;
}

interface SeriesIdentifier {
  remoteId: string;
  slug: string;
  sourceUrl: string;
}

interface ParsedSeriesDetails {
  manga: Manga;
  chapters: ChapterSource[];
}

const DEFAULT_BROWSE_FILTERS: BrowseFilters = {
  sort: "views_m.za",
  sortLabel: DEFAULT_SORT_LABEL,
  release: undefined,
  chapters: undefined,
  includeGenres: [],
  excludeGenres: [],
  includeLanguages: [],
  excludeLanguages: [],
  includeOriginals: [],
  excludeOriginals: [],
};

const slugResolver = new SlugResolver({
  normalize: normalizeSlug,
  isRemoteId: (value) => /^\d+$/.test(value),
});

const chapterBuilder = new ChapterListBuilder({
  normalizeSlug,
  defaultLanguage: "en",
});

const seriesDetailsCache = new Map<string, MangaDetailsResult>();

const LANGUAGE_NAME_MAP = new Map<string, string>([
  ["english", "en"],
  ["korean", "ko"],
  ["japanese", "ja"],
  ["chinese", "zh"],
  ["chinese (traditional)", "zh-Hant"],
  ["chinese (simplified)", "zh-Hans"],
  ["spanish", "es"],
  ["spanish (latam)", "es-419"],
  ["portuguese", "pt"],
  ["portuguese (br)", "pt-BR"],
  ["french", "fr"],
  ["german", "de"],
  ["italian", "it"],
  ["polish", "pl"],
  ["indonesian", "id"],
  ["vietnamese", "vi"],
  ["thai", "th"],
  ["turkish", "tr"],
  ["arabic", "ar"],
  ["filipino", "fil"],
  ["tagalog", "fil"],
  ["malay", "ms"],
  ["russian", "ru"],
  ["ukrainian", "uk"],
  ["hungarian", "hu"],
  ["czech", "cs"],
  ["romanian", "ro"],
  ["dutch", "nl"],
]);

const LANGUAGE_PARAM_MAP: Record<string, string> = {
  en: "en",
  "en-us": "en",
  en_gb: "en",
  es: "es",
  "es-419": "es_419",
  pt: "pt",
  "pt-br": "pt_br",
  fr: "fr",
  de: "de",
  ru: "ru",
  ko: "ko",
  ja: "ja",
  zh: "zh",
  "zh-hk": "zh_hk",
  "zh-tw": "zh_tw",
  th: "th",
  id: "id",
  vi: "vi",
  it: "it",
  pl: "pl",
  tr: "tr",
  ar: "ar",
  ms: "ms",
  uk: "uk",
  cs: "cs",
  hu: "hu",
  ro: "ro",
  nl: "nl",
  fil: "fil",
  "fr-ca": "fr",
};

const CDNS_ALLOWLIST = [
  "bato.to",
  "www.bato.to",
  "dto.to",
  "fto.to",
  "hto.to",
  "jto.to",
  "mto.to",
  "wto.to",
  "batotoo.com",
  "battwo.com",
  "mangatoto.com",
  "mangatoto.net",
  "mangatoto.org",
  "comiko.net",
  "comiko.org",
  "readtoto.com",
  "readtoto.net",
  "readtoto.org",
  "xbato.com",
  "xbato.net",
  "xbato.org",
  "zbato.com",
  "zbato.net",
  "zbato.org",
];

export class BatoToClient {
  private readonly scraper: HtmlScraperClient;
  private readonly pagePipeline: PagePipeline;

  constructor(private readonly context: ExtensionContext) {
    this.scraper = new HtmlScraperClient({
      baseUrl: BASE_URL,
      allowedHosts: CDNS_ALLOWLIST,
      defaultHeaders: DEFAULT_HEADERS,
    });

    this.pagePipeline = new PagePipeline({
      scraper: this.scraper,
      buildRequest: (remoteChapterId) => ({
        path: `/chapter/${remoteChapterId}`,
        headers: {
          Referer: `${BASE_URL}/`,
        },
      }),
      parser: (html, ctx) => parseChapterImages(html, ctx.remoteChapterId),
    });
  }

  async searchCatalog(
    query: string,
    page: number,
    options?: {
      language?: string;
      canonicalLanguage?: string;
      canonicalSort?: NormalizedSortField;
      rawLanguage?: string;
      skipLanguageFilter?: boolean;
    },
  ): Promise<CatalogResponse> {
    const params: Record<string, string> = {
      word: query,
      page: `${Math.max(1, page)}`,
    };
    if (options?.language) {
      params.langs = options.language;
    }
    const filterOptions: LanguageFilterOptions = {
      language: options?.language,
      skipFiltering: options?.skipLanguageFilter ?? false,
    };
    this.context.logger.debug("Bato search request (canonical → remote)", {
      canonicalFilters: {
        language: options?.canonicalLanguage ?? null,
        sort: options?.canonicalSort ?? null,
      },
      rawFilters: {
        language: options?.rawLanguage ?? null,
      },
      request: {
        path: SEARCH_PATH,
        params,
      },
    });
    const parsed = await this.loadCatalogPage(
      SEARCH_PATH,
      params,
      filterOptions,
    );
    const totalResults = await this.resolveTotalResults(
      page,
      parsed,
      SEARCH_PATH,
      params,
      filterOptions,
      SEARCH_RESULTS_PER_PAGE,
    );
    const enriched: CatalogResponse = { ...parsed, totalResults };
    this.context.logger.debug("Parsed Bato search results", {
      query,
      page,
      count: enriched.results.length,
      hasMore: enriched.hasMore,
      totalPages: parsed.pagination?.totalPages ?? null,
      totalResults,
    });
    return enriched;
  }

  async browseCatalog(
    page: number,
    filters: BrowseFilters,
    options?: {
      language?: string;
      canonicalLanguage?: string;
      canonicalSort?: NormalizedSortField;
      rawLanguage?: string;
      skipLanguageFilter?: boolean;
    },
  ): Promise<CatalogResponse> {
    const params = buildBrowseParams(page, filters);
    const filterOptions: LanguageFilterOptions = {
      language: options?.language,
      skipFiltering: options?.skipLanguageFilter ?? false,
    };
    this.context.logger.debug("Bato browse request (canonical → remote)", {
      canonicalFilters: {
        language: options?.canonicalLanguage ?? null,
        sort: options?.canonicalSort ?? null,
      },
      rawFilters: {
        language: options?.rawLanguage ?? null,
      },
      request: {
        path: BROWSE_PATH,
        params,
      },
    });
    const parsed = await this.loadCatalogPage(
      BROWSE_PATH,
      params,
      filterOptions,
    );
    const totalResults = await this.resolveTotalResults(
      page,
      parsed,
      BROWSE_PATH,
      params,
      filterOptions,
      DEFAULT_BROWSE_LIMIT,
    );
    const enriched: CatalogResponse = { ...parsed, totalResults };
    this.context.logger.debug("Parsed Bato browse results", {
      page,
      count: enriched.results.length,
      hasMore: enriched.hasMore,
      sortLabel: options?.canonicalSort ?? filters.sortLabel ?? filters.sort,
      sortParam: filters.sort,
      totalPages: parsed.pagination?.totalPages ?? null,
      totalResults,
    });
    return enriched;
  }

  async getSeriesDetails(
    seriesSlug: string,
    options?: { includeChapters?: boolean },
  ): Promise<MangaDetailsResult> {
    const normalizedSlug = normalizeSlug(seriesSlug);
    const useRemoteId = slugResolver.isRemoteId(seriesSlug);
    const cacheKey = useRemoteId
      ? (slugResolver.getSlug(seriesSlug) ?? normalizedSlug)
      : normalizedSlug;

    const cached =
      options?.includeChapters === false
        ? undefined
        : seriesDetailsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const remoteId = useRemoteId
      ? seriesSlug
      : await this.resolveSeriesRemoteId(normalizedSlug);

    const html = await this.scraper.get(`/series/${remoteId}`);
    const parsed = parseSeriesDetails(html, remoteId, cacheKey);

    slugResolver.register(parsed.manga.id, remoteId);
    const chapters =
      options?.includeChapters === false
        ? []
        : chapterBuilder.build(parsed.manga.id, parsed.chapters);
    const details: MangaDetailsResult = { manga: parsed.manga, chapters };
    if (options?.includeChapters !== false) {
      seriesDetailsCache.set(parsed.manga.id, details);
      if (parsed.manga.id !== cacheKey) {
        seriesDetailsCache.set(cacheKey, details);
      }
    }
    return details;
  }

  async getChapters(seriesSlug: string): Promise<Chapter[]> {
    const details = await this.getSeriesDetails(seriesSlug);
    return details.chapters;
  }

  async getPages(seriesSlug: string, chapterSlug: string): Promise<Page[]> {
    const remoteChapterId = await this.ensureRemoteChapterId(
      seriesSlug,
      chapterSlug,
    );
    return this.pagePipeline.fetch(remoteChapterId);
  }

  private async loadCatalogPage(
    path: string,
    params: Record<string, string>,
    filterOptions?: LanguageFilterOptions,
  ): Promise<CatalogResponse> {
    const html = await this.scraper.get(path, { params });
    const parsed = parseCatalogList(html);
    return applyLanguageFilter(parsed, filterOptions ?? {});
  }

  private async resolveTotalResults(
    requestedPage: number,
    response: CatalogResponse,
    path: string,
    params: Record<string, string>,
    filterOptions: LanguageFilterOptions | undefined,
    perPageFallback: number,
  ): Promise<number> {
    const pagination = response.pagination;
    if (!pagination?.totalPages || pagination.totalPages <= 1) {
      return response.results.length;
    }

    const currentPage = Math.max(1, requestedPage);
    const totalPages = Math.max(1, pagination.totalPages);
    const basePerPage =
      perPageFallback > 0
        ? perPageFallback
        : Math.max(response.results.length, 1);
    const pageCapacity =
      currentPage < totalPages
        ? Math.max(response.results.length, basePerPage)
        : basePerPage;
    const previousItems = Math.max(totalPages - 1, 0) * pageCapacity;

    if (currentPage >= totalPages) {
      return previousItems + response.results.length;
    }

    try {
      const lastPageParams = { ...params, page: `${totalPages}` };
      const lastPage = await this.loadCatalogPage(
        path,
        lastPageParams,
        filterOptions,
      );
      return previousItems + lastPage.results.length;
    } catch (error) {
      this.context.logger.warn("Failed to fetch catalog last page", {
        path,
        targetPage: totalPages,
        error: error instanceof Error ? error.message : error,
      });
      const optimistic = totalPages * pageCapacity;
      return Math.max(response.results.length, optimistic);
    }
  }

  private async ensureRemoteChapterId(
    seriesSlug: string,
    chapterSlug: string,
  ): Promise<string> {
    const normalizedSeries = slugResolver.isRemoteId(seriesSlug)
      ? (slugResolver.getSlug(seriesSlug) ?? normalizeSlug(seriesSlug))
      : normalizeSlug(seriesSlug);
    const normalizedChapter = normalizeSlug(chapterSlug);

    let remoteChapterId = chapterBuilder.getRemoteChapterId(
      normalizedSeries,
      normalizedChapter,
    );
    if (!remoteChapterId) {
      await this.getSeriesDetails(seriesSlug);
      remoteChapterId = chapterBuilder.getRemoteChapterId(
        normalizedSeries,
        normalizedChapter,
      );
    }
    if (!remoteChapterId) {
      throw new Error(
        `Unable to resolve remote chapter id for ${seriesSlug}/${chapterSlug}`,
      );
    }
    return remoteChapterId;
  }

  private async resolveSeriesRemoteId(slug: string): Promise<string> {
    return slugResolver.ensureRemoteId(slug, async (normalized) => {
      const results = await this.searchCatalog(normalized, 1);
      const match =
        results.results.find((manga) => manga.id === normalized) ??
        results.results[0];
      if (!match) {
        throw new Error(`Unable to resolve series slug "${slug}"`);
      }
      const remoteId = slugResolver.getRemoteId(match.id);
      if (!remoteId) {
        throw new Error(`Missing remote id mapping for slug "${match.id}"`);
      }
      return remoteId;
    });
  }
}

const buildBrowseParams = (
  page: number,
  filters: BrowseFilters,
): Record<string, string> => {
  const params = new URLSearchParams();
  params.set("page", `${Math.max(1, page)}`);
  params.set("limit", `${DEFAULT_BROWSE_LIMIT}`);
  params.set("sort", filters.sort);

  appendIncludeExclude(
    params,
    "genres",
    filters.includeGenres,
    filters.excludeGenres,
  );
  appendIncludeExclude(
    params,
    "langs",
    filters.includeLanguages,
    filters.excludeLanguages,
  );
  appendIncludeExclude(
    params,
    "origs",
    filters.includeOriginals,
    filters.excludeOriginals,
  );

  if (filters.release) {
    params.set("release", filters.release);
  }
  if (filters.chapters) {
    params.set("chapters", filters.chapters);
  }

  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
};

interface LanguageFilterOptions {
  language?: string;
  skipFiltering?: boolean;
}

const applyLanguageFilter = (
  response: CatalogResponse,
  options: LanguageFilterOptions = {},
): CatalogResponse => {
  if (!options.language || options.skipFiltering) {
    return response;
  }
  const normalized = LanguageNormalizer.normalize(options.language);
  if (!normalized) {
    return response;
  }
  const filtered = response.results.filter((manga) =>
    LanguageNormalizer.matches(manga.language, normalized),
  );
  return { ...response, results: filtered };
};

const appendIncludeExclude = (
  params: URLSearchParams,
  key: string,
  include: string[],
  exclude: string[],
) => {
  const inc = dedupeValues(include);
  const exc = dedupeValues(exclude);
  if (inc.length === 0 && exc.length === 0) {
    return;
  }
  let value = "";
  if (inc.length > 0) {
    value += inc.join(",");
  }
  if (exc.length > 0) {
    value += "|";
    value += exc.join(",");
  }
  params.set(key, value);
};

const dedupeValues = (values: string[]): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    if (seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
};

const parseCatalogList = (html: string): CatalogResponse => {
  const $ = load(html);
  const results: Manga[] = [];

  $("#series-list .item").each((_, element: Element) => {
    const card = $(element);
    const anchor = card.find(".item-title").first();
    const href = anchor.attr("href");
    if (!href) {
      return;
    }

    const identifier = parseSeriesLink(href);
    if (!identifier) {
      return;
    }
    slugResolver.register(identifier.slug, identifier.remoteId);

    const title =
      anchor.text().trim() ||
      identifier.slug.replace(/[-_]+/g, " ") ||
      identifier.remoteId;

    const coverCandidate = card.find(".item-cover img").attr("src");
    const coverUrl = coverCandidate
      ? resolveAbsoluteUrl(coverCandidate, BASE_URL)
      : undefined;

    const rawTags = extractTagTexts($, card);
    const { languageCode, tags } = extractLanguageFromTags(card, rawTags);
    const authors = extractCardPeople(card);

    results.push({
      id: identifier.slug,
      title,
      description: undefined,
      coverUrl,
      authors,
      tags,
      status: undefined,
      language: languageCode,
      sourceUrl: identifier.sourceUrl,
    });
  });

  const hasMore = extractHasMore($);
  return {
    results,
    hasMore,
    totalResults: results.length,
    pagination: extractPaginationMeta($),
  };
};

const parseSeriesDetails = (
  html: string,
  remoteId: string,
  slugHint: string,
): ParsedSeriesDetails => {
  const $ = load(html);
  const canonicalHref =
    $('link[rel="canonical"]').attr("href") ?? `${BASE_URL}/series/${remoteId}`;
  const canonicalSlug =
    resolveSlugFromUrl(canonicalHref, { baseUrl: BASE_URL }) ??
    slugHint ??
    normalizeSlug(remoteId);

  const title =
    $(".title-set .item-title a").first().text().trim() ||
    $("title").first().text().trim() ||
    canonicalSlug;

  const extractor = CheerioExtractor.for($, {
    manga: {
      id: canonicalSlug,
      title,
      language: "en",
      sourceUrl: canonicalHref,
    } as Manga,
    meta: {},
  });

  extractor.text({
    into: "manga.description",
    selector: "#limit-height-body-summary .limit-html",
    transform: (value) =>
      value
        .replace(/\s+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim(),
  });

  const summaryExtra = extractExtraInfo($);
  if (summaryExtra) {
    const current = extractor.result().manga.description ?? "";
    const description = current
      ? `${current}\n\n${summaryExtra}`
      : summaryExtra;
    extractor.set("manga.description", description.trim());
  }

  const coverSrc = $(".attr-cover img").attr("src");
  extractor.set(
    "manga.coverUrl",
    coverSrc ? resolveAbsoluteUrl(coverSrc, BASE_URL) : undefined,
  );

  const authors = extractAttrList($, "Authors");
  const artists = extractAttrList($, "Artists");
  extractor.set("manga.authors", authors);
  if (artists.length > 0) {
    extractor.set("manga.artists", artists);
  }

  const genres = extractAttrList($, "Genres");
  extractor.set("manga.tags", genres);

  const translatedLanguage =
    extractAttrList($, "Translated language")[0] ?? "English";
  const languageCode =
    LANGUAGE_NAME_MAP.get(translatedLanguage.toLowerCase()) ?? "en";
  extractor.set("manga.language", languageCode);

  const statusValue = extractAttrText($, "Upload status");
  extractor.set("manga.status", normalizeStatusValue(statusValue));

  const mangaState = extractor.result().manga;
  const chapters = parseChapterEntries($, mangaState.language ?? "en");

  return { manga: mangaState, chapters };
};

const extractAttrList = ($: CheerioAPI, label: string): string[] => {
  const container = findAttrItem($, label);
  if (!container.length) {
    return [];
  }

  const working = container.clone();
  working.find("b, strong").each((_, element: Element) => {
    const text = $(element).text().trim();
    if (text.endsWith(":")) {
      $(element).remove();
    }
  });

  const seen = new Set<string>();
  const values: string[] = [];

  working.find("a, span, u, b").each((_, element: Element) => {
    const raw = $(element).text().replace(/\s+/g, " ").trim();
    if (!raw) {
      return;
    }
    for (const part of raw.split(/[,/]/)) {
      const value = part.replace(/\s+/g, " ").trim();
      if (!value) {
        continue;
      }
      const key = value.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      values.push(value);
    }
  });

  return values;
};

const extractAttrText = ($: CheerioAPI, label: string): string | undefined => {
  const container = findAttrItem($, label);
  if (!container.length) {
    return undefined;
  }
  const text = container
    .clone()
    .children("b, strong")
    .remove()
    .end()
    .text()
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
};

const findAttrItem = ($: CheerioAPI, label: string): Cheerio<Element> => {
  return $(".attr-item").filter((_, element: Element) => {
    const heading = $(element).find("b, strong").first().text().toLowerCase();
    return heading.includes(label.toLowerCase());
  });
};

const extractExtraInfo = ($: CheerioAPI): string | undefined => {
  const header = $("h5")
    .filter((_, element: Element) =>
      $(element).text().toLowerCase().includes("extra info"),
    )
    .first();
  if (!header.length) {
    return undefined;
  }
  const body = header.next();
  const text = body.text().replace(/\s+/g, " ").trim();
  return text || undefined;
};

const extractTagTexts = (api: CheerioAPI, card: Cheerio<Element>): string[] => {
  return card
    .find(".item-genre")
    .first()
    .find("span, b, u")
    .map((_, element: Element) => api(element).text().replace(/,/g, "").trim())
    .get()
    .filter(Boolean);
};

const extractCardPeople = (card: Cheerio<Element>): string[] => {
  const text = card.find(".item-alias").text();
  if (!text) {
    return [];
  }
  const fragments = text
    .split("/")
    .flatMap((fragment) => fragment.split(","))
    .map((fragment) => fragment.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const authors: string[] = [];
  for (const fragment of fragments) {
    const normalized = fragment.replace(/\s+\([^)]*\)$/g, "").trim();
    if (!normalized || seen.has(normalized.toLowerCase())) {
      continue;
    }
    seen.add(normalized.toLowerCase());
    authors.push(normalized);
  }
  return authors;
};

const extractLanguageFromTags = (
  card: Cheerio<Element>,
  tags: string[],
): { languageCode: string; tags: string[] } => {
  const flagCode = card.find("em.item-flag").attr("data-lang");
  if (flagCode && flagCode !== "null") {
    return {
      languageCode: flagCode,
      tags: tags,
    };
  }

  for (const tag of tags) {
    const code = LANGUAGE_NAME_MAP.get(tag.toLowerCase());
    if (code) {
      return {
        languageCode: code,
        tags: tags.filter((entry) => entry !== tag),
      };
    }
  }

  return {
    languageCode: "en",
    tags,
  };
};

const parseSeriesLink = (href: string): SeriesIdentifier | null => {
  const match = SERIES_PATH_REGEX.exec(href);
  if (!match?.groups?.id) {
    return null;
  }
  const remoteId = match.groups.id;
  const slugSegment = match.groups.slug
    ? decodeURIComponent(match.groups.slug)
    : undefined;
  const slug = slugSegment
    ? normalizeSlug(slugSegment)
    : normalizeSlug(remoteId);
  const sourceUrl = resolveAbsoluteUrl(href, BASE_URL);
  return { remoteId, slug, sourceUrl };
};

const parseChapterEntries = (
  $: CheerioAPI,
  fallbackLanguage: string,
): ChapterSource[] => {
  const entries: ChapterSource[] = [];
  $(".episode-list .item").each((_, element: Element) => {
    const block = $(element);
    const anchor = block.find("a.chapt").first();
    const href = anchor.attr("href");
    if (!href) {
      return;
    }
    const match = CHAPTER_PATH_REGEX.exec(href);
    if (!match?.groups?.id) {
      return;
    }
    const remoteId = match.groups.id;
    const title = anchor
      .text()
      .replace(/\s+/g, " ")
      .replace(/\s:\s/g, ": ")
      .trim();
    const chapterNumber = extractChapterNumber(title);
    const scanlator =
      block.find(".extra a span").first().text().trim() || undefined;
    const publishedAt =
      block.find(".extra > i").last().text().replace(/\s+/g, " ").trim() ||
      undefined;

    entries.push({
      remoteId,
      title,
      chapterNumber,
      publishedAt,
      language: fallbackLanguage,
      scanlator,
    });
  });
  return entries;
};

const extractHasMore = ($: CheerioAPI): boolean => {
  return (
    $("ul.pagination li").filter((_, element: Element) => {
      const item = $(element);
      if (item.hasClass("disabled")) {
        return false;
      }
      const arrow = item.find("span").text().trim();
      return arrow === "»" || arrow === "»»";
    }).length > 0
  );
};

const extractPaginationMeta = (
  $: CheerioAPI,
): CatalogPagination | undefined => {
  const pages = new Set<number>();
  $("ul.pagination li a.page-link").each((_, element: Element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    const textValue = Number.parseInt(
      anchor.text().replace(/[^0-9]/g, ""),
      10,
    );
    const candidate =
      parsePageNumberFromHref(href) ??
      (Number.isNaN(textValue) ? undefined : textValue);
    if (
      typeof candidate === "number" &&
      Number.isFinite(candidate) &&
      candidate > 0
    ) {
      pages.add(candidate);
    }
  });
  if (pages.size === 0) {
    return undefined;
  }
  return { totalPages: Math.max(...pages) };
};

const parsePageNumberFromHref = (href?: string): number | undefined => {
  if (!href) {
    return undefined;
  }
  try {
    const parsed = new URL(href, BASE_URL);
    const raw = parsed.searchParams.get("page");
    if (!raw) {
      return undefined;
    }
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : undefined;
  } catch {
    return undefined;
  }
};

const parseChapterImages = (html: string, remoteChapterId: string): Page[] => {
  const sources =
    matchConstArray(html, "imgHttps") ??
    matchConstArray(html, "imgHttpLis") ??
    [];
  if (sources.length === 0) {
    throw new Error("Chapter response did not include image sources");
  }

  return sources.map((src, index) => {
    const { width, height } = deriveImageDimensions(src);
    return {
      index: index + 1,
      imageUrl: src,
      headers: {
        Referer: `${BASE_URL}/chapter/${remoteChapterId}`,
      },
      width,
      height,
    };
  });
};

const matchConstArray = (html: string, variable: string): string[] | null => {
  const regex = new RegExp(`const\\s+${variable}\\s*=\\s*(\\[[\\s\\S]*?])`);
  const match = regex.exec(html);
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

const deriveImageDimensions = (
  imageUrl: string,
): { width?: number; height?: number } => {
  try {
    const pathname = new URL(imageUrl).pathname;
    const fileName = pathname.split("/").pop();
    if (!fileName) {
      return {};
    }
    const parts = fileName.split(".")[0]?.split("_") ?? [];
    if (parts.length < 3) {
      return {};
    }
    const sizes = parts.map((value) => Number.parseInt(value, 10));
    const [slug, first, second, third] = sizes;
    const bwh =
      Number.isFinite(slug) &&
      slug < 1_500_000 &&
      Number.isFinite(first) &&
      Number.isFinite(second) &&
      Number.isFinite(third) &&
      first > second &&
      first > third;
    if (bwh) {
      return {
        width: Number.isFinite(second) ? second : undefined,
        height: Number.isFinite(third) ? third : undefined,
      };
    }
    return {
      width: Number.isFinite(first) ? first : undefined,
      height: Number.isFinite(second) ? second : undefined,
    };
  } catch {
    return {};
  }
};

export const createDefaultBrowseFilters = (): BrowseFilters => {
  return {
    ...DEFAULT_BROWSE_FILTERS,
    includeGenres: [],
    excludeGenres: [],
    includeLanguages: [],
    excludeLanguages: [],
    includeOriginals: [],
    excludeOriginals: [],
  };
};

export const mapLanguageToBatoParam = (
  language?: string,
): string | undefined => {
  if (!language) {
    return undefined;
  }
  const normalized = LanguageNormalizer.normalize(language);
  if (!normalized) {
    return undefined;
  }
  const key = normalized.toLowerCase();
  return LANGUAGE_PARAM_MAP[key];
};

export const resolveSortParam = (
  sort: NormalizedSort | undefined,
): { sortParam: BrowseSort; label: NormalizedSortField } | undefined => {
  if (!sort) {
    return undefined;
  }
  const field = sort.field;
  const param = SORT_RESOLUTION[field];
  if (!param) {
    return undefined;
  }
  return { sortParam: param, label: field };
};

export const labelForSortParam = (
  sortParam: BrowseSort,
): NormalizedSortField => {
  for (const [label, param] of Object.entries(SORT_RESOLUTION)) {
    if (param === sortParam) {
      return label as NormalizedSortField;
    }
  }
  return DEFAULT_SORT_LABEL;
};
