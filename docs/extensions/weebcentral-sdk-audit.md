# WeebCentral Extension SDK Audit

This document captures the developer pain points surfaced while reviewing the WeebCentral extension and proposes SDK-level abstractions that keep power users in control while stripping away repeated boilerplate.

## Observed Pain Points

1. **Manifest + settings schema validation is reimplemented per extension** – The current module manually re-validates JSON structure, allowed types, and defaults before exporting the manifest (`resources/extensions/weebcentral/src/index.ts:51`). Any new extension must copy the same guard rails and type coercion logic.
2. **Filter normalization and dual-mode search plumbing are bespoke** – Switching between "hot" and query-driven search, mapping UI aliases, and handling string/array coercion is tightly coupled to this extension (`resources/extensions/weebcentral/src/index.ts:124`, `resources/extensions/weebcentral/src/index.ts:231`). Small differences across sources force every developer to rewrite the same helpers.
3. **Settings-driven behaviors (request concurrency, CDN rewrites) live behind ad-hoc readers** – Numeric parsing, clamping, and host overrides are handled by hand (`resources/extensions/weebcentral/src/index.ts:306`). There is no shared way to declare settings → behavior relationships.
4. **Remote ID ↔ slug management is hand-crafted** – Developers must normalize slugs, track lookups, deduplicate concurrent fetches, and remap chapter IDs themselves (`resources/extensions/weebcentral/src/client.ts:80`). This is especially painful on sites that expose numeric IDs but expect slug-based routing in the SDK.
5. **HTML fetch + guardrails are reauthored per client** – Host allowlists, default headers, HX-specific requests, and concurrency limits are coded inline (`resources/extensions/weebcentral/src/client.ts:182`, `resources/extensions/weebcentral/src/client.ts:214`). Any new scraper repeats the same scaffolding.
6. **DOM traversal helpers proliferate without structure** – Extracting labels, tags, canonical URLs, and list fields requires extension-specific Cheerio code (`resources/extensions/weebcentral/src/client.ts:304`). Sharing patterns (label-based extraction, tag parsing, normalizing whitespace) would shrink every extension dramatically.
7. **Chapter assembly + slug collision handling is bespoke** – Building human-friendly slugs, keeping remote ID mappings, teasing chapter numbers out of text, and hydrating full chapter lists require ~150 lines of logic (`resources/extensions/weebcentral/src/client.ts:521`). Other sources will face the same issues with different selectors.
8. **Image-page pipelines and CDN rewrites are ad-hoc** – Fetching HX chapter images, setting Referer headers, and optionally rewriting hosts are all local utilities (`resources/extensions/weebcentral/src/client.ts:581`, `resources/extensions/weebcentral/src/index.ts:328`). There is no reusable "page fetcher" abstraction.

## Proposed SDK Abstractions

Each abstraction is meant to be composable: the SDK provides the default implementation, but extensions can override narrow hooks (selectors, header builders, slug strategies) without forking the entire pipeline.

### 1. `defineExtensionManifest`

**Problem:** Manual JSON validation and allowed-setting enforcement is copy/pasted (`resources/extensions/weebcentral/src/index.ts:51`).

**Abstraction:** Provide a helper that consumes raw manifest JSON (or TypeScript object) and enforces the SDK contracts.

```ts
import { defineExtensionManifest } from "@/sdk/extension";

export const manifest = defineExtensionManifest({
  json: manifestJson,
  settings: {
    "requests.concurrency": z.number().int().min(1).max(10).default(3),
    "image.cdnHost": z.string().url().optional(),
  },
});
```

**Extension hooks**

- Accept an optional `schema` (zod or SDK mini-DSL) for advanced validation.
- Allow `transform` callback to mutate derived fields (e.g., inject tags).

### 2. `createSearchController`

**Problem:** Every extension hand-wires dual-mode search ("hot" vs. normal), filter aliasing, and default sorts (`resources/extensions/weebcentral/src/index.ts:124`).

**Abstraction:** Ship a controller that:

- Declares supported modes, sorts, orders, and flags in one schema.
- Handles alias mapping + coercion for arrays/CSV strings.
- Exposes `controller.normalize(payload)` and `controller.shouldHydrateHot()`.

```ts
const searchController = createSearchController({
  modes: ["hot", "search"],
  defaultMode: "hot",
  sorts: ["Best Match", "Popularity"] as const,
  filters: {
    includedTags: { multiple: true, aliases: ["included_tag", "includedTags"] },
    official: { enum: FILTER_FLAGS, default: "Any" },
  },
});

const filters = searchController.normalize(payload);
if (searchController.shouldHydrateHot(filters)) {
  return client.fetchHot(filters.hotSort, settings);
}
```

**Extension hooks:** Provide `deriveDefaultSort(query)` or `mapFilters(filters)` overloads for sources that need bespoke fallbacks.

### 3. `SettingsBinder`

**Problem:** Settings-to-behavior plumbing (concurrency limits, CDN overrides) is duplicated (`resources/extensions/weebcentral/src/index.ts:306`).

**Abstraction:** Offer a fluent API that binds settings keys to typed accessors with clamping + fallback built-in.

```ts
const settings = SettingsBinder.from(context.settings)
  .number("requests.concurrency", { min: 1, max: 6, default: 3 })
  .string("image.cdnHost", { normalize: (v) => v.trim() || undefined })
  .result();

const concurrency = settings.getNumber("requests.concurrency");
const cdnHost = settings.getString("image.cdnHost");
```

**Extension hooks:** Allow per-setting coercion functions and expose `.withOverride(key, fn)` so niche sites can override values dynamically.

### 4. `SlugResolver`

**Problem:** Slug ↔ remote ID mapping, deduped lookups, and normalization logic are complex and repetitive (`resources/extensions/weebcentral/src/client.ts:80`).

**Abstraction:** Provide a reusable resolver that:

- Normalizes slugs consistently (accent folding, punctuation stripping).
- Stores slug→ID and ID→slug mappings in-memory (with TTL hooks).
- Deduplicates concurrent lookups via an in-flight map.
- Exposes `resolver.lookup(slug, { hydrate })` where `hydrate` is the site-specific search call.

```ts
const slugResolver = new SlugResolver({
  normalize: normalizeSlug,
  hydrate: async (slug) => {
    const results = await client.searchCatalog(slug, 1);
    return results[0]?.remoteId;
  },
});

const remoteId = await slugResolver.ensureRemoteId(seriesSlug);
```

**Extension hooks:** Replace `normalize` for languages with different rules, plug custom cache stores, or override `hydrate` per site.

### 5. `HtmlScraperClient`

**Problem:** Fetching HTML with host allowlists, default headers, HX triggers, and concurrency caps is hand-coded (`resources/extensions/weebcentral/src/client.ts:182`).

**Abstraction:** Provide a base client that extensions configure with:

- `baseUrl`, `defaultHeaders`, `allowedHosts`.
- `beforeRequest` / `afterResponse` hooks (for cookies, retries, proxying).
- Built-in concurrency limiter per host.

```ts
const scraper = new HtmlScraperClient({
  baseUrl: "https://weebcentral.com",
  allowedHosts: ["weebcentral.com", "www.weebcentral.com"],
  defaultHeaders: DEFAULT_HEADERS,
});

const html = await scraper.get("/search/data", {
  params: buildSearchParams(filters),
  headers: { "HX-Request": "true" },
});
```

**Extension hooks:** Override `buildRequestUrl`, attach custom rate-limit buckets, or intercept responses for caching.

### 6. `CheerioExtractor`

**Problem:** Label-based text extraction, canonical URL fetching, and tag parsing are rewritten each time (`resources/extensions/weebcentral/src/client.ts:304`).

**Abstraction:** Offer a utility module with declarative field descriptors.

```ts
const details = CheerioExtractor.for($)
  .text({ selector: "h1", fallback: "title" })
  .list({ label: "Author" })
  .tags({ sectionLabel: "Tags" })
  .canonical({ selector: "link[rel='canonical']", fallbackPath: `/series/${remoteId}` })
  .result();
```

**Extension hooks:** Supply custom matchers (e.g., `labelMatcher` for non-English sources) or override `transform(value)` per field.

### 7. `ChapterListBuilder`

**Problem:** Handling slug collisions, chapter numbering, published dates, and remote ID registration is verbose (`resources/extensions/weebcentral/src/client.ts:607`).

**Abstraction:** Provide a builder that accepts DOM nodes + callbacks for site-specific selectors but encapsulates slug + mapping rules.

```ts
const chapterBuilder = new ChapterListBuilder({
  slugResolver,
  language: "en",
  defaultTitle: "Chapter",
  slugStrategy: {
    derive: ({ number, title, remoteId }) =>
      number ? formatNumber(number) : normalizeSlug(title ?? remoteId),
  },
});

const chapters = chapterBuilder.build({
  nodes: $("div[x-data*='checkNewChapter']"),
  remoteIdSelector: (node) => node.find("a[href*='/chapters/']").attr("href"),
  publishedAtSelector: (node) => node.attr("x-data"),
});
```

**Extension hooks:** Override `slugStrategy` or `metadataExtractor` for sites with nested volume structures.

### 8. `PagePipeline`

**Problem:** Fetching chapter images, setting referers, handling HX params, and rewriting CDN hosts are local utilities (`resources/extensions/weebcentral/src/client.ts:581`, `resources/extensions/weebcentral/src/index.ts:328`).

**Abstraction:** Provide a pipeline object that:

- Knows how to fetch paginated/HX endpoints given a remote chapter ID.
- Applies default headers + allows per-site overrides.
- Supports post-processors like `rewriteHosts(host)` or `rewriteExtensions(fn)`.

```ts
const pagePipeline = new PagePipeline({
  scraper,
  refererBuilder: (remoteChapterId) => `${BASE_URL}/chapters/${remoteChapterId}`,
  requestParams: { reading_style: "long_strip" },
});

const pages = await pagePipeline.fetch(remoteChapterId, {
  transformers: [rewriteHosts(settings.getString("image.cdnHost"))],
});
```

**Extension hooks:** Provide custom `paginatedFetch` for sources that require GraphQL or token exchange before image retrieval.

---

Together these abstractions:

- Remove ~400 lines of scaffolding from WeebCentral-like extensions.
- Offer targeted extension points so niche sources can override only the pieces they need (slug strategy, selectors, filters) instead of copying entire files.
- Encourage consistent behaviors (settings parsing, request guardrails, logging) across the SDK, reducing maintenance costs.

## Current Implementation Status

- SDK helpers now live under `server/src/sdk/extensions/` (`manifest.ts`, `search-controller.ts`, `settings-binder.ts`, `slug-resolver.ts`, `html-scraper-client.ts`, `cheerio-extractor.ts`, `chapter-list-builder.ts`, `page-pipeline.ts`) and are re-exported via `server/src/sdk/index.ts`.
- The WeebCentral extension (`resources/extensions/weebcentral/src/index.ts` and `client.ts`) has been refactored to consume these abstractions—manifest parsing, search filter normalization, settings binding, slug/ID resolution, HTML fetching, chapter assembly, and page handling all rely on the shared toolkit now.
- Additional extensions can import the same helpers from the SDK entrypoint to replicate this lean structure without re-implementing boilerplate.
