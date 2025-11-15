# Installer Module

The installer module (`server/src/modules/installer`) automates extension installation from Git repositories. It validates repository metadata, downloads sources, compiles TypeScript, writes bundles to disk, and records job status so the renderer can track progress.

## Responsibilities
- Accept install requests (either via `/api/installer` or `/api/extensions/install`).
- Fetch and validate a `index.json` manifest from a Git host (GitHub/GitLab/Bitbucket).
- Download the requested extension source tree, compile it (if TypeScript), and stage artefacts inside `EXTENSIONS_INSTALL_DIR`.
- Register the extension in SQLite and verify it loads via the shared extension runtime.
- Persist job status rows in `extension_installs` for auditing.

## Core Components
| Component | File(s) | Description |
| --- | --- | --- |
| Controller & Routes | `installer.controller.ts`, `installer.routes.ts` | Exposes `POST /api/installer` and `GET /api/installer/install/:jobId`; `ExtensionsController` reuses the same service for `/api/extensions/install`. |
| Service | `installer.service.ts` | Queues jobs, processes them sequentially, updates DB state, and coordinates downloader → compiler → packager steps. |
| GitRepositoryFetcher | `fetchers/git-fetcher.ts` | Normalises repo URLs to raw `index.json` links, downloads JSON via the shared HTTP client, and validates schema. |
| ExtensionSourceFetcher | `fetchers/source-fetcher.ts` | Fetches entrypoint/manifest/package files declared in repository metadata. |
| ExtensionCompiler | `compiler/extension-compiler.ts` | Bundles TypeScript/JavaScript entrypoints via esbuild by materialising fetched files into a temp workspace so multi-file imports compile against a consistent Node target. |
| FileExtensionPackager | `packager.ts` | Writes compiled code + manifest to `resources/extensions/<id>`, ensures directories exist, and upserts DB rows. |
| Validator | `validators/schema-validator.ts` | Provides strict validation for `index.json` to prevent unexpected keys or unsupported schema versions. |

## Database Tables
```
extension_installs
  id TEXT PRIMARY KEY
  extension_id TEXT NOT NULL REFERENCES extensions(id)
  status TEXT CHECK ('pending','downloading','compiling','installing','completed','failed')
  repo_url TEXT NULL
  extension_metadata TEXT NOT NULL (raw JSON from index)
  requested_at INTEGER NOT NULL
  completed_at INTEGER NULL
  error TEXT NULL
```

Jobs are inserted with status `pending`; `InstallerService.processQueue` promotes them through the lifecycle while logging to the shared logger.

## Happy Path Walkthrough
1. Renderer POSTs `{ repositoryUrl, extensionIds?, branch? }` to `/api/installer` (or `/api/extensions/install`).
2. `InstallerService.queueInstall` fetches `index.json`, filters extensions if IDs were provided, enqueues one row per extension, and asynchronously kicks off `processQueue`.
3. `processInstall` downloads the extension source via `ExtensionSourceFetcher`. If `language === 'typescript'`, it invokes `ExtensionCompiler.compileFromFiles`; otherwise. it reuses the entrypoint code.
4. `FileExtensionPackager.installExtension` writes the compiled entry (`*.js`), manifest, and `package.json` (if dependencies) into the install directory and updates the `extensions` table.
5. `verifyExtension` uses the shared extension loader/runtime to ensure the bundle can be initialised before marking the job `completed`.
6. Clients poll `GET /api/installer/install/:jobId` or `/api/extensions/install/:jobId` to surface status/errors.

## Failure Handling
- **Validation errors** (bad schema, missing files) throw `DomainError`/`ValidationError`; the service sets `status='failed'` and records the message.
- **Compilation errors** collect esbuild diagnostics and bubble them into the `error` column so the renderer can show actionable output.
- **Verification failures** dispose the loader cache and warn via the logger; the job remains `failed` until a new install is queued.
- Jobs are processed sequentially today; adjust `InstallerConfig.concurrency` to parallelise once conflict handling is added.

## Configuration Hooks
- `EXTENSIONS_INSTALL_DIR` / `AppConfig.extensions.installDir` – where bundles land.
- `AppConfig.installer.tempDir` – staging area for future archive downloads (currently unused but reserved).
- `INSTALLER_VERIFY_SIGNATURES` – currently parsed but not enforced; add your signature checks inside `InstallerService.processInstall` if needed.

Keep this document in sync with installer changes so new contributors understand how extension packaging differs from runtime execution.
