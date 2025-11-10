# JAMRA Extension Authoring Guide

This guide walks you through everything you need to know to build, test, and ship an extension for JAMRA. It covers the runtime architecture, the manifest format, development workflow, and the minimum scraper contract the server expects.

If you just want to study a working example, `resources/extensions/weebcentral` is the canonical reference implementation. The sections below explain the patterns that extension follows and the surface area you can extend.

---

## Extension Workflow Overview

- **Registry** – On server boot we scan `resources/extensions/*/manifest.json`, normalise the manifest, and persist the entry in the `extensions` table (`server/src/modules/extensions/registry`).
- **Loader** – As soon as an extension is registered (local folder or install job) we compile its declared `entry` file with `esbuild` (`server/src/modules/extensions/loader`). TypeScript is supported; the loader outputs a CommonJS bundle that is evaluated in Node, so the first runtime call is hot.
- **Runtime** – The compiled module is cached, `init(context)` is called once, and subsequent lifecycle calls (`search`, `getMangaDetails`, etc.) reuse the same context until `dispose` (`server/src/modules/extensions/runtime`).
- **HTTP surface** – The backend exposes REST endpoints under `/api/extensions`. The React client consumes those APIs to render catalog search, manga details, and reader flows (`src/pages/ExtensionsPage.tsx`, etc.).
- **Installer (WIP)** – Remote installation endpoints exist under `/api/installer`, but the queue/validator is still stubbed. Today, extensions are installed by placing them under `resources/extensions/<id>`.

By default extensions run with full Node privileges. Use trusted code only. Network egress performed through `context.http` is filtered by a host allowlist (`SANDBOX_NET_ALLOWLIST`, see “Networking” below).

---

## Prerequisites

- Node 20+ and `pnpm` (same toolchain the repo uses).
- Basic familiarity with TypeScript and asynchronous programming.
- A reference API or site you plan to scrape. The runtime helper expects JSON responses; if you need HTML, be prepared to use `fetch` or another HTTP client inside your extension bundle.

---

## Recommended Directory Layout

```
resources/extensions/<your-id>/
  manifest.json
  assets/          # optional icons, screenshots
  src/
    index.ts       # required entry file, default export must be an ExtensionModule
    client.ts      # optional helpers (HTTP client, mappers, parsers)
    lib/           # optional shared utilities
```

Having a thin `index.ts` that wires the JAMRA contract and delegating the heavy lifting to dedicated helpers (`client.ts`, `lib/`) keeps the extension surface simple, which makes it easier for others to audit or contribute.

---

## Manifest Reference

Create a `manifest.json` in the root of your extension directory. The loader parses it with `ExtensionManifest` from `server/src/sdk/index.ts`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | ✅ | Unique identifier and folder name. Used as slug and database primary key. |
| `name` | string | ✅ | Human-friendly display name. |
| `version` | string | ✅ | Semantic version. |
| `description` | string | ❌ | Shown in the Extensions UI. |
| `author` | string | ❌ | Credits. |
| `language` | string | ✅ | Locale code (e.g. `"en"`). |
| `entry` | string | ✅ | Relative path to your entry module (e.g. `"src/index.ts"`). |
| `icon` | string | ❌ | Relative path to an icon asset. |
| `website` | string | ❌ | External link. |
| `tags` | string[] | ❌ | Keywords for discovery. |
| `settingsSchema` | object | ❌ | Optional UI schema (see below). |
| `minAppVersion` | string | ❌ | If set, the runtime can reject incompatible app versions (future use). |

### Settings schema

Use `settingsSchema` to define user-tweakable configuration. Each field becomes a form control in the Settings > Extensions UI.

```json
"settingsSchema": {
  "version": 1,
  "fields": [
    {
      "key": "image.cdnHost",
      "label": "Image CDN Host",
      "type": "string",
      "default": "cdn.example.com",
      "description": "Override the CDN used for image requests."
    },
    {
      "key": "reader.concurrentFetches",
      "label": "Concurrent Page Requests",
      "type": "number",
      "default": 4
    }
  ]
}
```

Keys should be namespaced (`area.settingName`) to avoid collisions. The runtime currently keeps settings in memory and will surface persisted values once the settings module is fully wired.

---

## Extension Module Contract

At runtime JAMRA looks for a default export that implements the lifecycle shown below. You can ship the most minimal CommonJS module imaginable:

```js
module.exports = {
  async search(payload, context) {
    // ...
  },
  async getMangaDetails(payload, context) {
    // ...
  },
  async getChapters(payload, context) {
    // ...
  },
  async getPages(payload, context) {
    // ...
  },
};
```

The registry already has the manifest contents (via `manifest.json`), so exporting a manifest is optional. If you omit it the runtime automatically injects the one from disk before the first lifecycle method runs.

When you want TypeScript completion, import the types and use `satisfies ExtensionModule` for ergonomics:

```ts
import type { ExtensionModule } from "../../../../server/src/sdk/index.ts";
import manifest from "../manifest.json" with { type: "json" };
import { ExampleClient } from "./client.ts";

const extension = {
  manifest,
  async search(payload, context) {
    const client = new ExampleClient(context);
    const response = await client.search(payload.query, payload.page ?? 1);
    return {
      results: response.data.map(mapSeries),
      hasMore: response.pagination?.hasNextPage ?? false,
      totalResults: response.pagination?.totalItems ?? response.data.length,
    };
  },
  async getMangaDetails(payload, context) {
    // ...
  },
  async getChapters(payload, context) {
    // ...
  },
  async getPages(payload, context) {
    // ...
  },
} satisfies ExtensionModule;

export default extension;
```

### Lifecycle summary

| Method | When it runs | Expectations |
| --- | --- | --- |
| `init(context)` | Once per process, right after the module is instantiated. | Warm caches, validate credentials, or log readiness. |
| `search(payload, context)` | On `/api/extensions/:id/search`. | Return `{ results: Manga[]; hasMore: boolean; totalResults: number }`. Respect pagination. |
| `getMangaDetails(payload, context)` | On `/api/extensions/:id/manga/:mangaId`. | Return `{ manga, chapters }`. Use the same IDs returned in `search`. |
| `getChapters(payload, context)` | On `/api/extensions/:id/manga/:mangaId/chapters`. | Return `Chapter[]` if the client requests chapters separately. |
| `getPages(payload, context)` | On `/api/extensions/:id/manga/:mangaId/chapters/:chapterId/pages`. | Return `{ pages: Page[] }` containing signed image URLs and any required HTTP headers (e.g. referers, cookies). |
| `getSettings(current, context)` | (Future) When the UI fetches extension-specific settings. | Return an updated schema or `null`. |
| `onSettingsChange(next, context)` | (Future) When settings are saved. | Persist state or update internal caches. |
| `dispose(context)` | When the runtime is torn down. | Clean up timers or close network connections. |

Return values must conform to the interfaces exported in `server/src/sdk/index.ts`. Those types are the single source of truth.

---

## Shared SDK Helpers

Most scraper boilerplate already lives in the SDK so you rarely have to re-write it. Import everything you need from `server/src/sdk/index.ts`—that file now re-exports the helper suite under `server/src/sdk/extensions`.

| Helper | What it does | Typical usage |
| --- | --- | --- |
| `defineExtensionManifest` | Validates manifest JSON before you export it. | `const manifest = defineExtensionManifest(manifestJson);` |
| `createSearchController` | Normalises filters, mode switching, and array/string coercion. | `const filters = searchController.normalize(payload.filters, payload.query);` |
| `SettingsBinder` | Binds settings keys to typed accessors with clamping. | `const settings = SettingsBinder.from(context.settings).number("requests.concurrency", { min: 1, max: 6 }).result();` |
| `SlugResolver` | Maintains slug ↔ remote ID mappings and dedupes in-flight lookups. | `const remoteId = await slugResolver.ensureRemoteId(seriesSlug, hydrateFn);` |
| `HtmlScraperClient` | Fetches HTML with host allowlists, default headers, and concurrency limits. | `const html = await scraper.get("/search/data", { params });` |
| `CheerioExtractor` | Declaratively extracts text/lists/canonicals from DOM trees. | `CheerioExtractor.for($, { manga: {} }).text({ label: "Description", into: "manga.description" });` |
| `ChapterListBuilder` | Builds chapter arrays, slugifies IDs, and tracks remote chapter IDs. | `const chapters = chapterBuilder.build(seriesSlug, parsedEntries);` |
| `PagePipeline` | Fetches chapter images (HX requests, headers) and applies transformers (e.g., CDN rewrites). | `const pages = await pagePipeline.fetch(remoteChapterId, { transformers: [PagePipeline.rewriteHosts(cdnHost)] });` |
| `toAbsoluteUrl(value, base)` | Resolves relative URLs safely. | `const coverUrl = toAbsoluteUrl(src, BASE_URL);` |
| `runLimited(items, limit, task)` | Executes async tasks with bounded concurrency. | `await runLimited(seriesList, 5, hydrate);` |
| `extractSlugFromUrl(url, { baseUrl })` | Derives a normalized slug from any absolute/relative URL. | `const slug = extractSlugFromUrl(href, { baseUrl: BASE_URL });` |
| `normalizeStatusValue(value)` | Maps arbitrary status text → `Manga["status"]`. | `manga.status = normalizeStatusValue(statusText);` |
| `extractChapterNumber(title)` | Pulls chapter numbers from strings like `"Chapter 12.5"`. | `entry.chapterNumber = extractChapterNumber(entry.title);` |

Keep site-specific parsing (selectors, special casing) in your extension, but reach for these helpers whenever you need HTTP access, slug normalization, setting coercion, or DOM utilities. This keeps new sources consistent and drastically reduces the amount of custom glue required.

--- 

## Working with `ExtensionContext`

Every lifecycle method receives a context object with three utilities:

1. **Settings** – `context.settings` exposes the current settings map. Access keys that you defined in `manifest.settingsSchema`. Values are frozen; clone before mutating.
2. **HTTP helper** – `context.http.get<T>(url, options?)` performs JSON GET requests with optional headers and request timeout. Hosts are validated against the runtime allowlist.
3. **Logger** – `context.logger.info|warn|error|debug(message, meta?)` writes to the backend log with extension metadata included automatically.

### Networking and host allowlist

- Hosts are taken from `config.sandbox.allowNetworkHosts` (`SANDBOX_NET_ALLOWLIST=example.com,cdn.example.com`).
- If the allowlist is empty, all hosts are permitted; otherwise every request through `context.http` must target an allowed host.
- The helper enforces JSON responses (content type must include `application/json`). For HTML or binary payloads instantiate your own client (global `fetch`, `node-fetch`, `got`, etc.) inside the extension bundle. You still control exposure by only exporting the narrow API from `index.ts`.

### Logging

Logs include `extensionId`, `slug`, and `version`. Use structured metadata so users can filter easily:

```ts
context.logger.debug("Fetched 20 results", { page: payload.page });
context.logger.warn("API rate limited", { delayMs: backoff });
```

### Keeping the public surface small

Export only the `ExtensionModule` from `index.ts`. Any helper modules (`client.ts`, parsers, rate limiters) stay private to your extension bundle. If you want to intentionally expose helpers (for people scripting against your extension), re-export them explicitly from a separate entry point.

---

## Step-by-Step: Building a Scraper

1. **Create the manifest**  
   Copy `resources/extensions/weebcentral/manifest.json` as a starting point and update `id`, `name`, `entry`, and other fields.

2. **Add a typed API client**  
   Implement request helpers in `src/client.ts`. Use TypeScript interfaces to describe the remote payloads and map them to JAMRA’s `Manga`, `Chapter`, and `Page` models.

3. **Implement `src/index.ts`**  
   Wire your client into the required lifecycle methods. Keep `index.ts` declarative: map and normalize data, delegate non-trivial logic to helpers.

   ```ts
   import type {
     ExtensionModule,
     MangaSearchResult,
   } from "../../../../server/src/sdk/index.ts";
   import manifest from "../manifest.json" with { type: "json" };
   import { ExampleClient } from "./client.ts";

   const extension = {
     manifest,
     async init(context) {
       context.logger.info("Example extension ready");
     },
     async search(payload, context): Promise<MangaSearchResult> {
       const client = new ExampleClient(context);
       const response = await client.search(payload.query, payload.page ?? 1);
       return {
         results: response.data.map(mapSeries),
         hasMore: response.pagination?.hasNextPage ?? false,
         totalResults: response.pagination?.totalItems ?? response.results.length,
       };
     },
     // ...implement other lifecycle methods
   } satisfies ExtensionModule;

   export default extension;
   ```

4. **Expose optional settings**  
   Bind configuration values via `context.settings`. Keep defaults in the manifest so the UI presents sensible initial values.

5. **Test locally**  
   Start the backend with `pnpm dev:server`. The bootstrapping routine (`registerLocalExtensions`) will ingest any folder under `resources/extensions`. Call the REST endpoints directly:

   ```bash
   curl "http://localhost:3000/api/extensions/<id>/search?query=foo"
   curl "http://localhost:3000/api/extensions/<id>/manga/<slug>"
   ```

   Automated extension tests are not available yet; `pnpm test:extensions` simply builds the server and reports that the suite is pending.

---

## Local Development Loop

- **Backend** – `pnpm dev:server` runs the Express API with hot reload through `tsx`.
- **Frontend** – `pnpm dev` starts the Vite client. The Extensions page uses the REST API; once your extension responds successfully it will appear automatically.
- **Logs** – Backend logs go to STDOUT during development and to `%APPDATA%/JAMRA/logs/main.log` in packaged builds.
- **Clean rebuild** – If you swap dependencies or output grows stale, clear the esbuild cache by restarting the backend or deleting `node_modules/.cache` (esbuild runs in-memory; there is no on-disk cache per extension).

---

## Distribution & Packaging

- **Manual install (today)** – Ship a zipped folder matching the structure above. Users can drop it into `resources/extensions/<id>` alongside `manifest.json`. The backend will pick it up on next start.
- **Installer API (roadmap)** – `/api/installer` is scaffolded but not yet implemented. When complete, the backend will download archives into `config.extensions.bundleDir`, validate contents, and unpack into `installDir`.
- **Bundling considerations** – The loader bundles your entry file on the fly. Keep dependencies lightweight; avoid shipping unused tooling. If you need native modules, ensure they are compatible with the Electron/Node version JAMRA uses.

---

## Best Practices

- **Keep IDs stable** – `Manga.id`, `Chapter.id`, and `Page.imageUrl` must remain stable across requests so downloader and reader history stay consistent.
- **Validate upstream data** – Normalize `statuses`, parse numbers with fallbacks, and guard against missing fields, just like the WeebCentral example does.
- **Respect pagination** – Support `payload.page` in `search` and return both `hasMore` and `totalResults`. The UI depends on them for pagination.
- **Annotate headers** – Provide any required HTTP headers (referers, cookies, authorization) in the `Page` objects so the reader can fetch images without additional logic.
- **Rate limiting** – If your source enforces limits, implement throttling or batching inside your helper modules. Expose concurrency knobs via `settingsSchema`.
- **Error handling** – Throw `Error` with descriptive messages. The runtime will wrap them in `ValidationError` responses for the REST API.
- **Testing** – A formal extension test harness is still TODO. For now rely on manual API checks and keep helper modules easy to unit test independently.

---

## Reference Material

- Extension type definitions: `server/src/sdk/index.ts`
- Runtime implementation: `server/src/modules/extensions/runtime/extension-runtime.ts`
- Loader implementation: `server/src/modules/extensions/loader/extension-loader.ts`
- Registry bootstrap: `server/src/modules/extensions/bootstrap/local-registry.ts`
- HTTP routes: `server/src/modules/extensions/extensions.routes.ts`
- Database schema: `server/src/database/schema.sql` (search for `CREATE TABLE extensions`)
- Architecture overview: `docs/backend/extensions.md`

Keep your entry modules minimal, rely on helper files for scraper-specific complexity, and take advantage of the provided context utilities. Following these conventions makes your extension easier to audit, maintain, and ship inside the JAMRA ecosystem.
