# Extensions Module

The extensions module (`server/src/modules/extensions`) is responsible for discovering installed extensions, compiling/loader caching, executing lifecycle methods, and exposing the HTTP façade the renderer uses to call into extension code.

## Architecture Snapshot
| Component | File(s) | Notes |
| --- | --- | --- |
| Registry | `registry/registry.service.ts` | Backed by the `extensions` table; exposes `list`, `findById`, `upsert`, `setEnabled`, `remove`. |
| Loader | `loader/extension-loader.ts` | Uses esbuild to bundle an extension entry file (supports `.ts/.tsx/.js/.jsx`), caches the compiled source in-memory for reuse. |
| Runtime | `runtime/extension-runtime.ts` | Instantiates extensions, injects the shared context (logger, HTTP client with host allowlist), runs lifecycle methods with per-call timeouts, and tracks settings state. |
| Bootstrap | `extensions.module.ts` + `bootstrap/*` | Registers local extensions on startup and enables a chokidar-based dev watcher that disposes/reloads extensions in development when files change. |
| Controller | `extensions.controller.ts` | HTTP adapter for registry queries, search/manga/chapters/pages execution, and installer passthrough routes. |

The `ExtensionsModule` singleton caches the registry/loader/runtime per `AppContext` and is imported by other modules (downloads, reader, installer) to avoid duplicate compilation work.

## API Surface (`/api/extensions`)
- `GET /api/extensions` → `{ extensions: ExtensionRecord[] }` sorted by name.
- `GET /api/extensions/:extensionId` → extension metadata (manifest, install info).
- `GET /api/extensions/:extensionId/search?query=&page=&filters...` → invokes the extension's `search` lifecycle method. Query parameters are normalised via `sdk/filters` helpers (`normalizeSearchFilters`, `pruneUnsupportedFilters`, `stripUnsupportedRawFilters`) before execution to guarantee manifests and runtime stay in sync.
- `GET /api/extensions/:extensionId/manga/:mangaId` → returns the details payload (including optional chapters when `includeChapters=true`).
- `GET /api/extensions/:extensionId/manga/:mangaId/chapters` → light-weight chapter list (bypasses details call if the UI already has metadata).
- `GET /api/extensions/:extensionId/manga/:mangaId/chapters/:chapterId/pages` → fetches remote page descriptors without proxying the binaries (reader/download modules consume the payload).
- `POST /api/extensions/install` & `GET /api/extensions/install/:jobId` → convenience shims that delegate to the installer module so the renderer can manage installs without hitting `/api/installer` directly.

Every route funnels through `ExtensionsController`, which verifies the extension exists (`registry.findById`), initialises it via the runtime, and applies capability-driven filter validation. Errors from extension execution bubble up as `400` (validation/domain) or `500` (unexpected runtime failure) via the shared error helpers.

## Execution Model
1. `ExtensionsController` asks the registry for an extension record.
2. `DefaultExtensionRuntime.initialise` loads the compiled source from the loader and `new Function`-evaluates it with Node's `require` + manifest injection.
3. Lifecycle methods (`search`, `getMangaDetails`, `getChapters`, `getPages`, etc.) run with a timeout defined in `AppConfig.extensions.runtime.timeoutMs` (default 10s). Long-running calls reject with `Extension execution timed out`.
4. The runtime enforces an outbound host allowlist via `SANDBOX_NET_ALLOWLIST` (parsed in `app-config.ts`) and proxies HTTP requests through the shared `HttpClient` so per-request headers/timeouts stay consistent.
5. In development, the chokidar watcher (`bootstrap/dev-watcher.ts`) disposes extensions when files under `EXTENSIONS_INSTALL_DIR` change, forcing the next request to trigger recompilation.

## Integration Points
- **Installer** – Newly installed extensions are written to disk (`resources/extensions/<id>` by default) and registered through the same registry used here, so no special handling is required once a job finishes.
- **Downloads/Reader** – These modules call into the runtime to fetch pages/chapters. Because the runtime caches compiled sources, multiple modules can execute the same extension without extra setup.
- **SDK** – Contracts for payloads (`SearchPayload`, `MangaDetailsPayload`, `PagesResult`, etc.) come from `server/src/sdk`. Update both the SDK and this doc when introducing new capabilities to guarantee third-party authors can keep up.

## Developing Against the Runtime
- Place compiled/manifested extensions under `resources/extensions/<id>` (or override via `EXTENSIONS_INSTALL_DIR`). `registerLocalExtensions` will upsert them on boot.
- When modifying manifests in development, the watcher automatically re-registers the extension and disposes the runtime instance so the next HTTP call reloads it.
- Use `/api/extensions/:id/...` endpoints with the renderer or `curl` to validate lifecycle methods before packaging new releases.

## Operational Considerations
- Because extensions run in-process, only install trusted bundles. The runtime currently mirrors host permissions; sandboxing beyond the HTTP host allowlist must be enforced externally.
- If extension execution fails consistently, the controller returns 400 for validation/domain errors and logs server-side stack traces for diagnostics.
- Keep manifests and source small; loader bundling happens on demand the first time an extension is invoked, so large dependency graphs will impact cold-start latency.
