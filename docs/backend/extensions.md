# JAMRA Extension Architecture

## Overview

The backend now splits extension responsibilities into dedicated modules:

- `catalog` handles discovery and caching of remote Mihon-style indexes.
- `extensions` manages the registry, loader, and runtime lifecycle.
- `installer` validates and unpacks bundles into `resources/extensions/<id>`.
- `settings` centralises mutable configuration and integrates with the client.
- `sdk` provides the contracts consumed by extension authors.

## Execution Model

The runtime now loads extension bundles directly into the primary Node context.
This keeps the bundle size leaner and avoids shipping a sandbox engine, but it
means extensions run with the same privileges as the host. Only install code
you trust, and encourage repository maintainers to publish compiled artifacts
alongside reviewable source.

Runtime still enforces an outbound host allowlist for HTTP helpers. Configure
`SANDBOX_NET_ALLOWLIST` (or the corresponding setting) if you need to restrict
extension network access.

During bootstrap we precompile each registered extension with esbuild. This
catches syntax errors at install time and removes the cold-start hit on the
first user request while keeping the source on disk reviewable.

## Repository Layout

```
server/src/
  app/                  Express bootstrap + route registration
  core/                 Configuration, database, infrastructure helpers
  modules/
    catalog/            Catalog service + drivers
    extensions/         Registry, loader, runtime
    installer/          Installation workflow
    settings/           Server/client configuration surface
  sdk/                  Contracts exported to extension developers
  shared/               Cross-cutting utilities (HTTP client, logger, errors)
```

Additional documentation (installation workflow, SDK publishing guide, etc.)
will live alongside this file as the feature set grows.

## HTTP Surface

- `GET /api/catalog?repoId=<optional>` → cached catalog entries.
- `POST /api/catalog/sync` (body `{ repoId?: string }`) → refresh default repo.
- `GET /api/extensions` → installed extension manifests.
- `GET /api/extensions/:id/search?query=&page=` → extension search proxy.
- `GET /api/extensions/:id/manga/:mangaId` → manga details + chapter list.
- `GET /api/extensions/:id/manga/:mangaId/chapters` → chapters only.
- `GET /api/extensions/:id/manga/:mangaId/chapters/:chapterId/pages` → page URLs.
- `POST /api/extensions/install` → install queue (TBD implementation).
