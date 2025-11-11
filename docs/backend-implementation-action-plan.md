# Backend Implementation Action Plan

**Project**: JAMRA - Manga Reader Application
**Document Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: Phase 1 Complete (3/27 tasks completed)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Context](#architecture-context)
3. [Implementation Progress](#implementation-progress)
4. [Phase 1: Foundation & Infrastructure](#phase-1-foundation--infrastructure-completed)
5. [Phase 2: Extension Installer](#phase-2-extension-installer--repository-management)
6. [Phase 3: Library & Reading Progress](#phase-3-library--reading-progress-system)
7. [Phase 4: Download System](#phase-4-download-system--offline-storage)
8. [Phase 5: Reader Backend APIs](#phase-5-reader-backend-apis)
9. [Phase 6: WebSocket Integration](#phase-6-websocket-integration--real-time-updates)
10. [Technical Reference](#technical-reference)
11. [Development Guidelines](#development-guidelines)

---

## Overview

### Project Goal
Implement a complete backend system for a manga reader application with:
- Extension-based manga source management
- User library with reading progress tracking
- Chapter download system for offline reading
- Reader APIs with image serving/proxying
- Real-time updates via WebSocket

### Implementation Strategy
- **6 Phases** with clear dependencies
- **27 Total Tasks** broken down by phase
- **Sequential execution** with some parallel opportunities
- **Database-first approach** with proper migrations
- **API-first design** with REST + WebSocket

### Technology Stack
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **WebSocket**: ws library
- **Architecture**: Layered (Controller → Service → Repository)

---

## Architecture Context

### Current State Analysis

#### ✅ Fully Implemented Modules
1. **Catalog System** (`server/src/modules/catalog/*`)
   - Database: `catalog_repos`, `catalog_entries` tables
   - Full CRUD operations for catalog repositories and entries
   - HTTP and Filesystem drivers for catalog sources
   - API: `GET /api/catalog`, `POST /api/catalog/sync`

2. **Extension System** (`server/src/modules/extensions/*`)
   - Database: `extensions` table
   - Extension registry with CRUD operations
   - Extension loader and runtime
   - Local extension bootstrapping with dev file watcher
   - API: All extension execution endpoints working
     - `GET /api/extensions` - List extensions
     - `GET /api/extensions/:id` - Extension details
     - `GET /api/extensions/:id/search` - Search manga
     - `GET /api/extensions/:id/manga/:mangaId` - Manga details
     - `GET /api/extensions/:id/manga/:mangaId/chapters` - List chapters
     - `GET /api/extensions/:id/manga/:mangaId/chapters/:chapterId/pages` - Get pages

3. **SDK Layer** (`server/src/sdk/extensions/*`)
   - HTML scraper client, Cheerio extractor
   - Page pipeline, Chapter list builder
   - Slug resolver, Search controller
   - Filter normalizer, Settings binder
   - Manifest validation

4. **WebSocket Infrastructure** (`server/src/websocket/*`)
   - Connection management system
   - Broadcast system for events
   - Event emitter functions defined
   - Client connection/disconnection handling

#### 🔴 Stubbed/Missing Modules
1. **Settings Module** - ✅ NOW IMPLEMENTED (Phase 1)
2. **Library/Reading Progress** - Not implemented (Phase 3)
3. **Download System** - Not implemented (Phase 4)
4. **Reader APIs** - Not implemented (Phase 5)
5. **Extension Installer** - Stubbed (Phase 2)

### Database Schema Overview

#### Current Tables (Migration v1)
```sql
-- Catalog System
catalog_repos (id, name, url, type, checksum, last_synced_at, created_at, updated_at)
catalog_entries (id, repo_id, slug, name, version, icon_url, archive_url, checksum, language, description, created_at, updated_at)

-- Extension System
extensions (id, slug, name, version, repo_source, install_path, manifest_json, enabled, installed_at, updated_at, checksum)
extension_installs (id, extension_id, status, requested_at, completed_at, error)

-- Settings System
settings (key, scope, value_json, updated_at)

-- Migration Tracking
migrations (version, description, applied_at)
```

#### Upcoming Tables
- **Migration v2**: Library and Reading Progress (Phase 3)
- **Migration v3**: Downloads and Downloaded Pages (Phase 4)

---

## Implementation Progress

### Overall Progress: 11% (3/27 tasks)

```
Phase 1: ████████████████████████████████ 100% (3/3)   ✅ COMPLETE
Phase 2: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% (0/5)   🔄 NEXT
Phase 3: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% (0/5)   ⏳ PENDING
Phase 4: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% (0/6)   ⏳ PENDING
Phase 5: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% (0/4)   ⏳ PENDING
Phase 6: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% (0/3)   ⏳ PENDING
```

### Task Checklist

#### Phase 1: Foundation ✅
- [x] Settings Module Implementation
- [x] Migration System with Version Tracking
- [x] Global Error Handling & Validation

#### Phase 2: Extension Installer 🔄
- [ ] Define Extension Repository Schema
- [ ] Implement Git Repository Fetcher
- [ ] Implement Extension Source Fetcher & Compiler
- [ ] Implement Extension Installation & Verification
- [ ] Create Installation API Endpoints

#### Phase 3: Library System ⏳
- [ ] Create Library Database Schema
- [ ] Implement Library Repository Layer
- [ ] Implement Reading Progress Repository
- [ ] Implement Library Service Layer
- [ ] Create Library API Controller & Routes

#### Phase 4: Download System ⏳
- [ ] Create Download Database Schema
- [ ] Implement File Storage Manager
- [ ] Implement Download Queue Repository
- [ ] Implement Chapter Downloader Service
- [ ] Implement Download Service Layer
- [ ] Create Download API Controller & Routes

#### Phase 5: Reader APIs ⏳
- [ ] Implement Reader Service Layer
- [ ] Implement Image Proxy Service
- [ ] Create Reader Controller & Routes
- [ ] Integrate Reading Progress Auto-save

#### Phase 6: WebSocket Integration ⏳
- [ ] Wire Download WebSocket Events
- [ ] Wire Library Update WebSocket Events
- [ ] Implement Client-to-Server Events (optional)

---

## Phase 1: Foundation & Infrastructure [COMPLETED]

**Status**: ✅ 100% Complete (3/3 tasks)
**Date Completed**: 2025-11-11

### 1.1 Settings Module Implementation ✅

**Objective**: Complete CRUD operations for application settings with database persistence.

#### Files Modified/Created:

1. **`server/src/modules/settings/settings.repository.ts`** ✅
   - **Lines**: 1-77 (complete rewrite)
   - **Changes**:
     - Added `Database.Database` constructor parameter
     - Implemented `get<T>(key, scope)` → `SELECT * FROM settings WHERE key = ? AND scope = ?`
     - Implemented `set<T>(key, value, scope)` → `INSERT OR REPLACE` with JSON serialization
     - Implemented `list(scope?)` → `SELECT * FROM settings` with optional scope filter
     - Implemented `remove(key)` → `DELETE FROM settings WHERE key = ?`
     - Added `mapSettingRow<T>()` helper to parse JSON and map to `Setting<T>` type
   - **Key Details**:
     - Default scope is `"app"` if not provided
     - Values stored as JSON in `value_json` column
     - Timestamps stored as Unix milliseconds
     - Uses prepared statements for all queries

2. **`server/src/modules/settings/settings.service.ts`** ✅
   - **Lines**: 1-28
   - **Changes**:
     - Removed all `NotImplementedError` throws
     - `get()`, `set()`, `list()` now delegate to repository
     - Added `remove()` method (was missing before)
   - **Pattern**: Pure pass-through to repository (no business logic needed)

3. **`server/src/modules/settings/settings.controller.ts`** ✅
   - **Lines**: 1-80
   - **Changes**:
     - Removed `NotImplementedError` handling
     - Added `get = async (req, res)` method (line 19-41)
       - Validates `key` param exists
       - Returns 404 if setting not found
       - Returns 200 with setting data
     - Added `remove = async (req, res)` method (line 64-79)
       - Validates `key` param exists
       - Returns 204 on success
     - Updated `list()` and `update()` to use actual service calls
     - All methods log errors to console before returning 500

4. **`server/src/modules/settings/settings.routes.ts`** ✅
   - **Lines**: 7-18
   - **Changes**:
     - Pass `context.db` to `createSettingsRepository()`
     - Register new routes:
       - `GET /:key` → `controller.get`
       - `DELETE /:key` → `controller.remove`

#### API Endpoints Available:

```typescript
GET    /api/settings              // List all settings (optional ?scope=app)
GET    /api/settings/:key         // Get specific setting (optional ?scope=app)
PUT    /api/settings              // Update/create setting { key, value, scope? }
DELETE /api/settings/:key         // Remove setting
```

#### Database Schema:
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,              -- 'app' | 'catalog' | 'extensions' | 'sandbox'
  value_json TEXT NOT NULL,         -- JSON-serialized value
  updated_at INTEGER NOT NULL       -- Unix timestamp (milliseconds)
);
```

#### TypeScript Types:
```typescript
type SettingScope = "app" | "catalog" | "extensions" | "sandbox";

interface Setting<T = unknown> {
  key: string;
  value: T;
  scope: SettingScope;
  updatedAt: Date;
}

interface SettingsRepository {
  get<T>(key: string, scope?: SettingScope): Promise<Setting<T> | null>;
  set<T>(key: string, value: T, scope?: SettingScope): Promise<void>;
  list(scope?: SettingScope): Promise<Setting[]>;
  remove(key: string): Promise<void>;
}
```

#### Testing Checklist:
- [ ] Settings persist across server restarts
- [ ] JSON values serialize/deserialize correctly
- [ ] Scope filtering works in `list()`
- [ ] `get()` returns 404 for non-existent keys
- [ ] `set()` creates new settings and updates existing ones
- [ ] `remove()` deletes settings successfully

---

### 1.2 Migration System with Version Tracking ✅

**Objective**: Implement proper database migration system with version tracking, history, and transactional execution.

#### Files Modified:

1. **`server/src/database/migrations.ts`** ✅
   - **Lines**: 1-175 (complete rewrite)
   - **Changes**:
     - Created `Migration` interface (lines 4-8)
       ```typescript
       interface Migration {
         version: number;
         description: string;
         up: (db: Database.Database) => void;
       }
       ```
     - Added `initMigrationsTable()` (lines 11-18)
       - Creates `migrations` table if not exists
       - Schema: `(version INTEGER PRIMARY KEY, description TEXT, applied_at INTEGER)`
     - Added `getAppliedMigrations()` (lines 21-26)
       - Returns array of applied version numbers
       - Used to determine which migrations are pending
     - Added `recordMigration()` (lines 29-38)
       - Inserts migration record after successful application
       - Stores timestamp as Unix milliseconds
     - Created `migrations` array registry (lines 41-124)
       - **Migration v1**: Initial schema with catalog and extensions
       - All existing schema.sql content moved into migration
       - Includes legacy table cleanup (DROP IF EXISTS)
     - Implemented `runMigrations()` (lines 127-175)
       - Initializes migrations table
       - Queries applied migrations
       - Filters pending migrations
       - Executes each migration in a transaction
       - Logs progress to console
       - Throws errors up to caller

#### Migration Registry Pattern:
```typescript
const migrations: Migration[] = [
  {
    version: 1,
    description: "Initial schema with catalog and extensions",
    up: (db) => {
      db.exec(`
        -- SQL DDL statements here
        CREATE TABLE IF NOT EXISTS ...
      `);
    },
  },
  // Add new migrations here with version: 2, 3, etc.
];
```

#### Database Schema - Migrations Table:
```sql
CREATE TABLE IF NOT EXISTS migrations (
  version INTEGER PRIMARY KEY,      -- Migration version number
  description TEXT NOT NULL,        -- Human-readable description
  applied_at INTEGER NOT NULL       -- Unix timestamp when applied
);
```

#### Migration Execution Flow:
1. Server starts → `runMigrations(db)` called
2. Create migrations table if not exists
3. Query applied migrations: `SELECT version FROM migrations`
4. Filter pending: `migrations.filter(m => !appliedVersions.includes(m.version))`
5. For each pending migration:
   - Log: `"Applying migration {version}: {description}"`
   - Execute in transaction:
     - Run `migration.up(db)`
     - Record in migrations table
   - Log: `"Migration {version} applied successfully"`
6. Log: `"All migrations completed successfully"`

#### Adding New Migrations:
```typescript
// In server/src/database/migrations.ts
const migrations: Migration[] = [
  { version: 1, description: "...", up: (db) => { ... } },

  // Add Phase 3 library tables:
  {
    version: 2,
    description: "Add library and reading progress tables",
    up: (db) => {
      db.exec(`
        CREATE TABLE library (...);
        CREATE TABLE reading_progress (...);
        CREATE INDEX idx_library_status ON library(status);
      `);
    },
  },

  // Add Phase 4 download tables:
  {
    version: 3,
    description: "Add downloads and downloaded pages tables",
    up: (db) => {
      db.exec(`
        CREATE TABLE downloads (...);
        CREATE TABLE downloaded_pages (...);
      `);
    },
  },
];
```

#### Benefits:
- ✅ Version tracking prevents re-running migrations
- ✅ Transactional execution (all-or-nothing)
- ✅ Migration history queryable in database
- ✅ Incremental schema changes supported
- ✅ Safe for production deployments
- ✅ Rollback capability (can be added later)

#### Testing Checklist:
- [ ] Fresh database runs all migrations in order
- [ ] Re-running migrations skips already applied ones
- [ ] Migration table records correct versions
- [ ] Failed migrations rollback transaction
- [ ] Console logs show migration progress

---

### 1.3 Global Error Handling & Validation Middleware ✅

**Objective**: Implement centralized error handling, request logging, and validation infrastructure.

#### Files Created:

1. **`server/src/middleware/error-handler.ts`** ✅ (NEW)
   - **Lines**: 1-50
   - **Purpose**: Global error handler for all Express routes
   - **Implementation**:
     - Error type mapping (lines 20-30):
       - `ValidationError` → 400 Bad Request
       - `NotImplementedError` → 501 Not Implemented
       - `DomainError` → 400 Bad Request
       - Default → 500 Internal Server Error
     - Error response format (lines 33-40):
       ```typescript
       interface ErrorResponse {
         error: string;        // Error type name
         message: string;      // Error message
         statusCode: number;   // HTTP status code
         details?: unknown;    // Stack trace (dev only)
       }
       ```
     - Logs all errors to console with timestamp and request context
     - Includes stack trace in `details` when `NODE_ENV !== "production"`
   - **Usage**: Registered in Express as last middleware (catches all errors)

2. **`server/src/middleware/request-logger.ts`** ✅ (NEW)
   - **Lines**: 1-27
   - **Purpose**: Log all HTTP requests with duration and status
   - **Implementation**:
     - Logs request on arrival: `→ METHOD PATH`
     - Hooks into `res.on("finish")` event
     - Calculates duration: `Date.now() - startTime`
     - Color-codes status by range:
       - 🟢 Green: 2xx (success)
       - 🔵 Cyan: 3xx (redirect)
       - 🟡 Yellow: 4xx (client error)
       - 🔴 Red: 5xx (server error)
     - Logs response: `← METHOD PATH STATUS_CODE DURATION_ms`
   - **Usage**: Registered as first middleware in Express

3. **`server/src/middleware/validation.ts`** ✅ (NEW)
   - **Lines**: 1-42
   - **Purpose**: Validate request body, query, and params against schemas
   - **Implementation**:
     - Accepts `ValidationSchemas` object:
       ```typescript
       interface ValidationSchemas {
         body?: Schema<unknown>;
         query?: Schema<unknown>;
         params?: Schema<unknown>;
       }
       ```
     - Validates each part of request if schema provided
     - Replaces `req.body`, `req.query`, `req.params` with parsed values
     - Forwards validation errors to error handler
   - **Usage Example**:
     ```typescript
     router.post("/", validate({ body: createMangaSchema }), controller.create);
     ```
   - **Note**: Ready for use but no schemas created yet (add in future phases)

#### Files Modified:

1. **`server/src/app/app.ts`** ✅
   - **Lines**: 1-35
   - **Changes**:
     - Imported `errorHandler` and `requestLogger` (lines 4-5)
     - Registered `requestLogger` as first middleware (line 13)
     - Moved health check endpoint before route registration (lines 20-26)
     - Registered `errorHandler` as last middleware (line 32)
   - **Middleware Order** (critical):
     ```typescript
     app.use(requestLogger);    // 1. Log all requests
     app.use(cors());           // 2. CORS
     app.use(express.json());   // 3. Parse JSON bodies
     // ... health check ...
     registerAppRoutes();       // 4. Application routes
     app.use(errorHandler);     // 5. Catch all errors (MUST BE LAST)
     ```

#### Error Types Available:
```typescript
// From server/src/shared/errors.ts
class NotImplementedError extends Error { }  // 501 status
class ValidationError extends Error { }      // 400 status
class DomainError extends Error { }          // 400 status
```

#### Example Error Responses:

**Validation Error (400)**:
```json
{
  "error": "ValidationError",
  "message": "Key is required",
  "statusCode": 400
}
```

**Not Implemented (501)**:
```json
{
  "error": "NotImplementedError",
  "message": "Extension installer not implemented",
  "statusCode": 501
}
```

**Internal Server Error (500)** (Development):
```json
{
  "error": "InternalServerError",
  "message": "Cannot read property 'id' of undefined",
  "statusCode": 500,
  "details": {
    "stack": "Error: ...\n    at ..."
  }
}
```

#### Console Output Examples:

**Request Logging**:
```
[2025-11-11T10:30:45.123Z] → GET /api/settings
[2025-11-11T10:30:45.156Z] ← GET /api/settings 200 33ms
```

**Error Logging**:
```
[2025-11-11T10:31:12.456Z] Error in POST /api/library: ValidationError: Manga ID is required
```

#### Benefits:
- ✅ Consistent error format across all endpoints
- ✅ Request/response logging for debugging
- ✅ Performance monitoring (request duration)
- ✅ Stack traces in development only (security)
- ✅ Validation infrastructure ready for future use
- ✅ No more try-catch blocks needed in controllers (errors bubble up)

#### Testing Checklist:
- [ ] All requests logged with timestamps
- [ ] Errors return structured JSON responses
- [ ] Status codes correct for each error type
- [ ] Stack traces hidden in production
- [ ] Request duration appears in logs
- [ ] 404 errors for unknown routes

---

## Phase 2: Extension Installer & Repository Management

**Status**: ⏳ Pending (0/5 tasks)
**Dependencies**: Phase 1 Complete ✅
**Estimated Time**: 8-12 hours

### Overview
Enable users to install extensions from Git repositories by providing a URL. The system fetches an `index.json` file, validates its structure, downloads extension source code, compiles TypeScript, and installs extensions in the correct directory.

### 2.1 Define Extension Repository Schema ✅ NEXT TASK

**Objective**: Create strict TypeScript types and JSON schema validator for extension repository index files.

#### Files to Create:

1. **`server/src/modules/installer/types/repository-schema.types.ts`** (NEW)
   - Purpose: TypeScript interfaces for repository index structure
   - Implementation:
     ```typescript
     export interface ExtensionRepositoryIndex {
       version: string;                    // Schema version (e.g., "1.0")
       repository: {
         name: string;                     // Repository name
         url: string;                      // Git repository URL
         author: string;                   // Author name
         description: string;              // Repository description
       };
       extensions: ExtensionMetadata[];    // Array of extensions in repo
     }

     export interface ExtensionMetadata {
       id: string;                         // Unique extension ID
       name: string;                       // Display name
       version: string;                    // Semver version (e.g., "1.0.0")
       author: string;                     // Extension author
       description: string;                // Extension description
       language: "typescript" | "javascript";
       entrypoint: string;                 // Path to main file (e.g., "src/index.ts")
       sourceUrl: string;                  // Raw URL to extension folder
       dependencies?: Record<string, string>; // npm dependencies
     }
     ```

2. **`server/src/modules/installer/validators/schema-validator.ts`** (NEW)
   - Purpose: Validate index.json against schema, reject unknown keys
   - Implementation approach:
     ```typescript
     export const validateRepositoryIndex = (
       data: unknown
     ): ExtensionRepositoryIndex => {
       // 1. Check data is an object
       if (!data || typeof data !== 'object') {
         throw new ValidationError('Invalid repository index: must be an object');
       }

       // 2. Check for unknown keys at root level
       const allowedKeys = ['version', 'repository', 'extensions'];
       const actualKeys = Object.keys(data);
       const unknownKeys = actualKeys.filter(k => !allowedKeys.includes(k));
       if (unknownKeys.length > 0) {
         throw new ValidationError(
           `Unknown keys in repository index: ${unknownKeys.join(', ')}`
         );
       }

       // 3. Validate required fields
       const { version, repository, extensions } = data as any;

       if (!version || typeof version !== 'string') {
         throw new ValidationError('Invalid version field');
       }

       // 4. Check schema version compatibility
       const supportedVersions = ['1.0'];
       if (!supportedVersions.includes(version)) {
         throw new ValidationError(
           `Unsupported schema version: ${version}. ` +
           `Supported versions: ${supportedVersions.join(', ')}`
         );
       }

       // 5. Validate repository object
       validateRepositoryObject(repository);

       // 6. Validate extensions array
       validateExtensionsArray(extensions);

       return { version, repository, extensions };
     };

     const validateRepositoryObject = (repo: unknown): void => {
       // Check repo is object with required fields
       // No unknown keys allowed
       // Validate types: name, url, author, description all strings
     };

     const validateExtensionsArray = (extensions: unknown): void => {
       // Check extensions is array
       // Validate each extension object
       // No unknown keys allowed
       // Validate required fields: id, name, version, author, etc.
       // Validate semver format for version
       // Validate language is "typescript" or "javascript"
     };
     ```

#### Example Valid index.json:
```json
{
  "version": "1.0",
  "repository": {
    "name": "My Extensions",
    "url": "https://github.com/user/manga-extensions",
    "author": "John Doe",
    "description": "Collection of manga extensions"
  },
  "extensions": [
    {
      "id": "mangadex",
      "name": "MangaDex",
      "version": "1.2.0",
      "author": "John Doe",
      "description": "Read manga from MangaDex",
      "language": "typescript",
      "entrypoint": "src/index.ts",
      "sourceUrl": "https://raw.githubusercontent.com/user/manga-extensions/main/extensions/mangadex",
      "dependencies": {
        "axios": "^1.6.0"
      }
    }
  ]
}
```

#### Validation Rules:
1. **Strict Schema**: Reject any unknown keys at any level
2. **Version Check**: Only accept supported schema versions (currently "1.0")
3. **Required Fields**: All non-optional fields must be present
4. **Type Validation**: Ensure correct types (string, array, object)
5. **Semver Validation**: Extension versions must be valid semver
6. **Enum Validation**: `language` must be "typescript" or "javascript"
7. **URL Validation**: `url` and `sourceUrl` must be valid URLs

#### Error Messages:
- "Unknown keys in repository index: foo, bar"
- "Unsupported schema version: 2.0. Supported versions: 1.0"
- "Invalid extension version: must be valid semver"
- "Invalid language: must be 'typescript' or 'javascript'"

#### Testing Checklist:
- [ ] Valid index.json passes validation
- [ ] Unknown keys at root level rejected
- [ ] Unknown keys in repository object rejected
- [ ] Unknown keys in extension objects rejected
- [ ] Invalid schema version rejected
- [ ] Missing required fields rejected
- [ ] Invalid types rejected (e.g., version as number)
- [ ] Invalid semver rejected
- [ ] Invalid language value rejected

---

### 2.2 Git Repository Fetcher

**Objective**: Fetch and parse `index.json` from Git repository URLs (GitHub, GitLab, Bitbucket).

#### Files to Create:

1. **`server/src/modules/installer/fetchers/git-fetcher.ts`** (NEW)
   - Implementation:
     ```typescript
     export class GitRepositoryFetcher {
       constructor(private readonly httpClient: HttpClient) {}

       async fetchRepositoryIndex(
         gitUrl: string,
         branch: string = 'main'
       ): Promise<ExtensionRepositoryIndex> {
         // 1. Normalize Git URL to raw URL
         const rawUrl = this.normalizeToRawUrl(gitUrl, branch);

         // 2. Fetch index.json
         const response = await this.httpClient.get(rawUrl, {
           timeout: 10000,
           headers: { 'User-Agent': 'JAMRA-Extension-Installer' }
         });

         // 3. Parse JSON
         let data: unknown;
         try {
           data = JSON.parse(response.data);
         } catch (error) {
           throw new ValidationError('Invalid JSON in index.json');
         }

         // 4. Validate against schema
         return validateRepositoryIndex(data);
       }

       private normalizeToRawUrl(gitUrl: string, branch: string): string {
         // Convert GitHub URLs:
         // https://github.com/user/repo
         // → https://raw.githubusercontent.com/user/repo/main/index.json

         // Convert GitLab URLs:
         // https://gitlab.com/user/repo
         // → https://gitlab.com/user/repo/-/raw/main/index.json

         // Convert Bitbucket URLs:
         // https://bitbucket.org/user/repo
         // → https://bitbucket.org/user/repo/raw/main/index.json
       }
     }
     ```

#### URL Normalization Rules:

| Platform   | Input URL                      | Raw URL                                            |
|------------|--------------------------------|----------------------------------------------------|
| GitHub     | github.com/user/repo           | raw.githubusercontent.com/user/repo/main/index.json |
| GitLab     | gitlab.com/user/repo           | gitlab.com/user/repo/-/raw/main/index.json        |
| Bitbucket  | bitbucket.org/user/repo        | bitbucket.org/user/repo/raw/main/index.json       |

#### Error Handling:
- **Invalid URL**: Throw `ValidationError` with message
- **Network Failure**: Throw `DomainError` with network details
- **404 Not Found**: Throw `ValidationError("index.json not found in repository")`
- **Invalid JSON**: Throw `ValidationError("Invalid JSON in index.json")`
- **Schema Validation**: Errors from validator bubble up

#### Branch Specification:
- Default: `main`
- User can specify: `?branch=develop`
- Example: `fetchRepositoryIndex(url, 'develop')`

#### Testing Checklist:
- [ ] GitHub URLs normalized correctly
- [ ] GitLab URLs normalized correctly
- [ ] Bitbucket URLs normalized correctly
- [ ] Branch parameter works
- [ ] Network timeout after 10 seconds
- [ ] 404 errors handled
- [ ] Invalid JSON handled
- [ ] Valid index.json returned

---

### 2.3 Extension Source Fetcher & Compiler

**Objective**: Download extension source code from repository and compile TypeScript to JavaScript.

#### Files to Create:

1. **`server/src/modules/installer/fetchers/source-fetcher.ts`** (NEW)
   - Purpose: Fetch all source files for an extension
   - Implementation:
     ```typescript
     export interface SourceFile {
       path: string;      // Relative path (e.g., "src/index.ts")
       content: string;   // File content
     }

     export class ExtensionSourceFetcher {
       async fetchExtensionSource(
         extension: ExtensionMetadata
       ): Promise<Map<string, string>> {
         // 1. Build list of files to fetch
         const filesToFetch = this.buildFileList(extension);

         // 2. Fetch each file
         const sourceFiles = new Map<string, string>();
         for (const filePath of filesToFetch) {
           const url = `${extension.sourceUrl}/${filePath}`;
           const content = await this.fetchFile(url);
           sourceFiles.set(filePath, content);
         }

         return sourceFiles;
       }

       private buildFileList(extension: ExtensionMetadata): string[] {
         // For now, fetch all common TypeScript project files:
         const files = [
           extension.entrypoint,           // e.g., "src/index.ts"
           'package.json',                 // If dependencies exist
           'tsconfig.json',                // TypeScript config
         ];

         // TODO: Future enhancement - fetch directory listing and download recursively
         return files.filter(Boolean);
       }
     }
     ```

2. **`server/src/modules/installer/compiler/typescript-compiler.ts`** (NEW)
   - Purpose: Compile TypeScript source to JavaScript
   - Implementation:
     ```typescript
     import * as ts from 'typescript';

     export interface CompilationResult {
       success: boolean;
       outputFiles: Map<string, string>;  // path → compiled JS
       errors: string[];
     }

     export class TypeScriptCompiler {
       compile(
         sourceFiles: Map<string, string>,
         extensionId: string
       ): CompilationResult {
         // 1. Create TypeScript compiler options
         const compilerOptions: ts.CompilerOptions = {
           target: ts.ScriptTarget.ES2020,
           module: ts.ModuleKind.CommonJS,
           esModuleInterop: true,
           strict: false,                     // Don't enforce strict mode
           skipLibCheck: true,                // Skip type checking of declaration files
           declaration: false,                // Don't generate .d.ts files
           outDir: undefined,                 // We'll handle output ourselves
         };

         // 2. Create in-memory TypeScript program
         const sourceFileMap = new Map<string, ts.SourceFile>();
         for (const [path, content] of sourceFiles) {
           const sourceFile = ts.createSourceFile(
             path,
             content,
             ts.ScriptTarget.ES2020,
             true
           );
           sourceFileMap.set(path, sourceFile);
         }

         // 3. Compile
         const outputFiles = new Map<string, string>();
         const errors: string[] = [];

         const host = this.createCompilerHost(sourceFileMap, outputFiles);
         const program = ts.createProgram(
           Array.from(sourceFiles.keys()),
           compilerOptions,
           host
         );

         // 4. Emit compiled JavaScript
         const emitResult = program.emit();

         // 5. Collect diagnostics (errors/warnings)
         const allDiagnostics = ts.getPreEmitDiagnostics(program)
           .concat(emitResult.diagnostics);

         for (const diagnostic of allDiagnostics) {
           const message = ts.flattenDiagnosticMessageText(
             diagnostic.messageText,
             '\n'
           );
           errors.push(message);
         }

         return {
           success: errors.length === 0,
           outputFiles,
           errors,
         };
       }

       private createCompilerHost(
         sourceFiles: Map<string, ts.SourceFile>,
         outputFiles: Map<string, string>
       ): ts.CompilerHost {
         // Create custom compiler host that reads from memory
         // and writes output to outputFiles map
       }
     }
     ```

#### Compilation Flow:
1. **Fetch Source**: Download all `.ts` files from `sourceUrl`
2. **Parse TypeScript**: Create in-memory SourceFile objects
3. **Compile**: Run TypeScript compiler with target ES2020, module CommonJS
4. **Collect Output**: Store compiled `.js` files in memory
5. **Handle Errors**: Collect and format compilation diagnostics

#### TypeScript Compiler Settings:
```json
{
  "target": "ES2020",
  "module": "CommonJS",
  "esModuleInterop": true,
  "strict": false,
  "skipLibCheck": true,
  "declaration": false
}
```

#### Error Handling:
- **Fetch Failure**: Throw `DomainError("Failed to fetch extension source")`
- **Compilation Errors**: Return in `CompilationResult.errors` array
- **Missing Entrypoint**: Throw `ValidationError("Entrypoint file not found")`

#### Testing Checklist:
- [ ] TypeScript files compile successfully
- [ ] JavaScript files copied as-is
- [ ] Compilation errors reported with line numbers
- [ ] Dependencies bundled correctly
- [ ] CommonJS module format output
- [ ] Source maps generated (optional)

---

### 2.4 Extension Installation & Verification

**Objective**: Install compiled extensions to disk, register in database, and verify they load correctly.

#### Files to Modify:

1. **`server/src/modules/installer/installer.service.ts`**
   - Current: All methods throw `NotImplementedError`
   - Implement:
     ```typescript
     export class InstallerService {
       constructor(
         private readonly db: Database.Database,
         private readonly gitFetcher: GitRepositoryFetcher,
         private readonly sourceFetcher: ExtensionSourceFetcher,
         private readonly compiler: TypeScriptCompiler,
         private readonly packager: ExtensionPackager
       ) {}

       async queueInstall(
         gitUrl: string,
         extensionIds?: string[]
       ): Promise<string[]> {
         // 1. Fetch repository index
         const repoIndex = await this.gitFetcher.fetchRepositoryIndex(gitUrl);

         // 2. Filter extensions if specific IDs provided
         const extensionsToInstall = extensionIds
           ? repoIndex.extensions.filter(e => extensionIds.includes(e.id))
           : repoIndex.extensions;

         // 3. Insert into extension_installs table
         const jobIds: string[] = [];
         for (const ext of extensionsToInstall) {
           const jobId = crypto.randomUUID();
           const stmt = this.db.prepare(`
             INSERT INTO extension_installs
             (id, extension_id, status, requested_at)
             VALUES (?, ?, ?, ?)
           `);
           stmt.run(jobId, ext.id, 'pending', Date.now());
           jobIds.push(jobId);
         }

         // 4. Start processing queue (don't await)
         this.processQueue().catch(console.error);

         return jobIds;
       }

       async processQueue(): Promise<void> {
         // 1. Query pending installs
         const stmt = this.db.prepare(`
           SELECT * FROM extension_installs
           WHERE status = 'pending'
           ORDER BY requested_at ASC
         `);
         const pending = stmt.all();

         // 2. Process each install
         for (const install of pending) {
           try {
             await this.processInstall(install);
           } catch (error) {
             // Log error and continue with next install
             console.error(`Install failed for ${install.extension_id}:`, error);
           }
         }
       }

       private async processInstall(install: any): Promise<void> {
         const { id: jobId, extension_id } = install;

         try {
           // Update status: downloading
           this.updateInstallStatus(jobId, 'downloading');

           // Fetch extension metadata from original repo
           // (Need to store repo URL in extension_installs table)
           const extensionMeta = await this.fetchExtensionMetadata(extension_id);

           // Fetch source code
           const sourceFiles = await this.sourceFetcher.fetchExtensionSource(extensionMeta);

           // Update status: compiling
           this.updateInstallStatus(jobId, 'compiling');

           // Compile if TypeScript
           let compiledFiles = sourceFiles;
           if (extensionMeta.language === 'typescript') {
             const result = this.compiler.compile(sourceFiles, extension_id);
             if (!result.success) {
               throw new Error(`Compilation failed: ${result.errors.join(', ')}`);
             }
             compiledFiles = result.outputFiles;
           }

           // Update status: installing
           this.updateInstallStatus(jobId, 'installing');

           // Package and install
           await this.packager.installExtension(compiledFiles, extensionMeta);

           // Verify extension loads
           await this.verifyExtension(extension_id);

           // Update status: completed
           this.updateInstallStatus(jobId, 'completed');
         } catch (error) {
           // Update status: failed
           this.updateInstallStatus(jobId, 'failed', error.message);
           throw error;
         }
       }

       private updateInstallStatus(
         jobId: string,
         status: string,
         error?: string
       ): void {
         const stmt = this.db.prepare(`
           UPDATE extension_installs
           SET status = ?, completed_at = ?, error = ?
           WHERE id = ?
         `);
         stmt.run(
           status,
           status === 'completed' || status === 'failed' ? Date.now() : null,
           error ?? null,
           jobId
         );
       }

       private async verifyExtension(extensionId: string): Promise<void> {
         // Load extension using existing extension loader
         // Call extension.getId() to verify it runs
         // If throws, installation failed
       }
     }
     ```

2. **`server/src/modules/installer/packager.ts`**
   - Current: Throws `NotImplementedError`
   - Implement:
     ```typescript
     export class ExtensionPackager {
       constructor(
         private readonly db: Database.Database,
         private readonly extensionsDir: string  // e.g., "./extensions"
       ) {}

       async installExtension(
         compiledFiles: Map<string, string>,
         metadata: ExtensionMetadata
       ): Promise<string> {
         const { id, version } = metadata;

         // 1. Create directory structure
         // extensions/{extensionId}/v{version}/
         const installPath = path.join(
           this.extensionsDir,
           id,
           `v${version}`
         );

         if (!fs.existsSync(installPath)) {
           fs.mkdirSync(installPath, { recursive: true });
         }

         // 2. Write compiled files to disk
         for (const [filePath, content] of compiledFiles) {
           const fullPath = path.join(installPath, filePath);
           const dir = path.dirname(fullPath);
           if (!fs.existsSync(dir)) {
             fs.mkdirSync(dir, { recursive: true });
           }
           fs.writeFileSync(fullPath, content, 'utf-8');
         }

         // 3. Write manifest.json
         const manifestPath = path.join(installPath, 'manifest.json');
         fs.writeFileSync(
           manifestPath,
           JSON.stringify(metadata, null, 2),
           'utf-8'
         );

         // 4. Register in database
         this.registerExtension(metadata, installPath);

         return installPath;
       }

       private registerExtension(
         metadata: ExtensionMetadata,
         installPath: string
       ): void {
         const stmt = this.db.prepare(`
           INSERT INTO extensions
           (id, slug, name, version, install_path, manifest_json, installed_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             version = excluded.version,
             install_path = excluded.install_path,
             manifest_json = excluded.manifest_json,
             updated_at = excluded.updated_at
         `);

         stmt.run(
           metadata.id,
           metadata.id,  // Use id as slug for now
           metadata.name,
           metadata.version,
           installPath,
           JSON.stringify(metadata),
           Date.now(),
           Date.now()
         );
       }
     }
     ```

#### Directory Structure:
```
extensions/
├── mangadex/
│   └── v1.2.0/
│       ├── src/
│       │   └── index.js      (compiled from index.ts)
│       ├── manifest.json     (extension metadata)
│       └── package.json      (dependencies)
└── mangakakalot/
    └── v1.0.0/
        └── ...
```

#### Database Updates:
```sql
-- extension_installs table needs repo_url column
ALTER TABLE extension_installs ADD COLUMN repo_url TEXT;
ALTER TABLE extension_installs ADD COLUMN extension_metadata TEXT;
```

#### Testing Checklist:
- [ ] Extension installs to correct directory
- [ ] Compiled files written to disk
- [ ] manifest.json created
- [ ] Extension registered in database
- [ ] Verification loads extension successfully
- [ ] Failed installations marked as "failed"
- [ ] Installation status tracked in database

---

### 2.5 Installation API Endpoints

**Objective**: Expose installation functionality via REST API.

#### Files to Modify:

1. **`server/src/modules/extensions/extensions.controller.ts`**
   - Update `install` method (currently returns 501)
   - Implementation:
     ```typescript
     install = async (req: Request, res: Response): Promise<void> => {
       try {
         const { repositoryUrl, extensionIds } = req.body as {
           repositoryUrl?: string;
           extensionIds?: string[];
         };

         if (!repositoryUrl) {
           res.status(400).json({ message: 'Repository URL is required' });
           return;
         }

         // Queue installation
         const jobIds = await this.installerService.queueInstall(
           repositoryUrl,
           extensionIds
         );

         res.status(200).json({
           message: 'Installation queued',
           jobIds,
           status: 'queued'
         });
       } catch (error) {
         console.error('Failed to queue installation:', error);
         res.status(500).json({ message: 'Failed to queue installation' });
       }
     };

     getInstallStatus = async (req: Request, res: Response): Promise<void> => {
       try {
         const { jobId } = req.params;

         const stmt = this.db.prepare(`
           SELECT * FROM extension_installs WHERE id = ?
         `);
         const job = stmt.get(jobId);

         if (!job) {
           res.status(404).json({ message: 'Installation job not found' });
           return;
         }

         res.json({
           jobId: job.id,
           extensionId: job.extension_id,
           status: job.status,
           requestedAt: job.requested_at,
           completedAt: job.completed_at,
           error: job.error
         });
       } catch (error) {
         console.error('Failed to get install status:', error);
         res.status(500).json({ message: 'Failed to get install status' });
       }
     };
     ```

2. **`server/src/modules/extensions/extensions.routes.ts`**
   - Add new routes:
     ```typescript
     router.post("/install", controller.install);
     router.get("/install/:jobId", controller.getInstallStatus);
     ```

#### API Endpoints:

**Install Extension(s)**:
```
POST /api/extensions/install
Body: {
  "repositoryUrl": "https://github.com/user/extensions",
  "extensionIds": ["mangadex", "mangakakalot"]  // Optional: install specific extensions
}
Response: {
  "message": "Installation queued",
  "jobIds": ["uuid1", "uuid2"],
  "status": "queued"
}
```

**Get Installation Status**:
```
GET /api/extensions/install/:jobId
Response: {
  "jobId": "uuid1",
  "extensionId": "mangadex",
  "status": "completed",  // 'pending' | 'downloading' | 'compiling' | 'installing' | 'completed' | 'failed'
  "requestedAt": 1699999999000,
  "completedAt": 1700000050000,
  "error": null
}
```

#### Testing Checklist:
- [ ] POST /install queues installation
- [ ] GET /install/:jobId returns status
- [ ] Multiple extensions can install in parallel
- [ ] Frontend can poll for status updates
- [ ] Failed installations return error message

---

## Phase 3: Library & Reading Progress System

**Status**: ⏳ Pending (0/5 tasks)
**Dependencies**: Phase 1 Complete ✅
**Estimated Time**: 6-8 hours
**Can Run Parallel**: Yes (after Phase 1, can run alongside Phase 2)

### Overview
Store user's manga collection with reading status (reading, completed, plan to read, etc.) and track reading progress per chapter.

### Database Schema (Migration v2):

```sql
-- Library items
CREATE TABLE library (
  id TEXT PRIMARY KEY,
  manga_id TEXT NOT NULL,               -- Extension-specific manga ID
  extension_id TEXT NOT NULL,           -- Which extension this manga is from
  title TEXT NOT NULL,
  cover_url TEXT,
  status TEXT NOT NULL,                 -- 'reading' | 'plan_to_read' | 'completed' | 'dropped' | 'on_hold'
  favorite BOOLEAN DEFAULT 0,
  date_added TEXT NOT NULL,
  last_updated TEXT NOT NULL,
  UNIQUE(manga_id, extension_id)        -- One entry per manga per extension
);

CREATE INDEX idx_library_status ON library(status);
CREATE INDEX idx_library_favorite ON library(favorite);
CREATE INDEX idx_library_date_added ON library(date_added);

-- Reading progress per chapter
CREATE TABLE reading_progress (
  id TEXT PRIMARY KEY,
  library_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,             -- Extension-specific chapter ID
  chapter_number TEXT,                  -- e.g., "12.5", "Chapter 1"
  page_number INTEGER NOT NULL DEFAULT 0,
  total_pages INTEGER,
  last_read TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  FOREIGN KEY(library_id) REFERENCES library(id) ON DELETE CASCADE
);

CREATE INDEX idx_reading_progress_library ON reading_progress(library_id);
CREATE INDEX idx_reading_progress_chapter ON reading_progress(chapter_id);
```

### TypeScript Types:

```typescript
// server/src/modules/library/library.types.ts
export type LibraryStatus =
  | 'reading'
  | 'plan_to_read'
  | 'completed'
  | 'dropped'
  | 'on_hold';

export interface LibraryItem {
  id: string;
  mangaId: string;
  extensionId: string;
  title: string;
  coverUrl?: string;
  status: LibraryStatus;
  favorite: boolean;
  dateAdded: Date;
  lastUpdated: Date;
}

export interface CreateLibraryItemInput {
  mangaId: string;
  extensionId: string;
  title: string;
  coverUrl?: string;
  status: LibraryStatus;
}

export interface LibraryFilters {
  status?: LibraryStatus;
  favorite?: boolean;
  search?: string;
}

export interface LibrarySort {
  field: 'dateAdded' | 'lastUpdated' | 'title';
  direction: 'asc' | 'desc';
}

export interface ReadingProgress {
  id: string;
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  pageNumber: number;
  totalPages?: number;
  lastRead: Date;
  completed: boolean;
}

export interface UpsertProgressInput {
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  pageNumber: number;
  totalPages?: number;
}
```

### API Endpoints:

```typescript
// Library Management
GET    /api/library                    // List all library items
       ?status=reading                 // Filter by status
       &favorite=true                  // Filter favorites only
       &search=one+piece               // Search by title
       &sort=dateAdded                 // Sort field
       &direction=desc                 // Sort direction
       &limit=20                       // Pagination
       &offset=0

POST   /api/library                    // Add manga to library
       Body: {
         mangaId: string,
         extensionId: string,
         title: string,
         coverUrl?: string,
         status: LibraryStatus
       }

GET    /api/library/:id                // Get library item details

PATCH  /api/library/:id                // Update library item
       Body: {
         status?: LibraryStatus,
         favorite?: boolean
       }

DELETE /api/library/:id                // Remove from library

// Reading Progress
GET    /api/library/:id/progress       // Get all progress for manga

PUT    /api/library/:id/progress       // Update reading progress
       Body: {
         chapterId: string,
         chapterNumber?: string,
         page: number,
         totalPages?: number
       }

GET    /api/library/:id/chapters/:chapterId/progress  // Get specific chapter progress
```

### Implementation Tasks:

#### 3.1 Create Library Database Schema
- Add migration v2 to `server/src/database/migrations.ts`
- Include indexes for performance
- Test foreign key constraints

#### 3.2 Implement Library Repository Layer
- Create `server/src/modules/library/library.repository.ts`
- Implement `SqliteLibraryRepository` with:
  - `add(item)` - INSERT
  - `remove(id)` - DELETE
  - `get(id)` - SELECT by ID
  - `getByMangaId(mangaId, extensionId)` - SELECT by unique constraint
  - `list(filters, sort, pagination)` - SELECT with WHERE, ORDER BY, LIMIT
  - `updateStatus(id, status)` - UPDATE status
  - `toggleFavorite(id)` - UPDATE favorite
- Use prepared statements for all queries

#### 3.3 Implement Reading Progress Repository
- Create `server/src/modules/library/progress.repository.ts`
- Implement `SqliteProgressRepository` with:
  - `get(libraryId, chapterId)` - SELECT specific chapter progress
  - `getByLibraryId(libraryId)` - SELECT all progress for manga
  - `upsert(progress)` - INSERT OR REPLACE
  - `markChapterComplete(libraryId, chapterId)` - UPDATE completed=1
  - `getLastRead(libraryId)` - SELECT ORDER BY last_read DESC LIMIT 1

#### 3.4 Implement Library Service Layer
- Create `server/src/modules/library/library.service.ts`
- Replace stubbed methods in `server/src/services/library.service.ts`
- Business logic:
  - When adding manga, fetch metadata from extension if not provided
  - When updating progress, auto-update lastUpdated in library
  - Validate status transitions

#### 3.5 Create Library API Controller & Routes
- Create `server/src/modules/library/library.controller.ts`
- Create `server/src/modules/library/library.routes.ts`
- Register routes in `server/src/app/routes.ts`:
  ```typescript
  app.use("/api/library", createLibraryRouter(context));
  ```

---

## Phase 4: Download System & Offline Storage

**Status**: ⏳ Pending (0/6 tasks)
**Dependencies**: Phase 3 Complete ✅
**Estimated Time**: 10-14 hours

### Overview
Download manga chapters from extensions, store pages locally for offline reading, track download progress, emit WebSocket events.

### Database Schema (Migration v3):

```sql
-- Download queue/history
CREATE TABLE downloads (
  id TEXT PRIMARY KEY,
  library_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  chapter_number TEXT,
  extension_id TEXT NOT NULL,
  status TEXT NOT NULL,                 -- 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled'
  progress INTEGER DEFAULT 0,           -- Percentage (0-100)
  total_pages INTEGER,
  error TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY(library_id) REFERENCES library(id) ON DELETE CASCADE
);

CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_downloads_library ON downloads(library_id);

-- Downloaded pages
CREATE TABLE downloaded_pages (
  id TEXT PRIMARY KEY,
  download_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  page_url TEXT NOT NULL,               -- Original URL
  file_path TEXT NOT NULL,              -- Local file path
  file_size INTEGER,
  downloaded_at TEXT NOT NULL,
  FOREIGN KEY(download_id) REFERENCES downloads(id) ON DELETE CASCADE,
  UNIQUE(download_id, page_number)
);

CREATE INDEX idx_downloaded_pages_download ON downloaded_pages(download_id);
```

### File Storage Structure:

```
data/
└── downloads/
    ├── {download_id}/
    │   ├── page_001.jpg
    │   ├── page_002.jpg
    │   └── page_003.png
    └── {another_download_id}/
        └── ...
```

### TypeScript Types:

```typescript
// server/src/modules/downloads/downloads.types.ts
export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Download {
  id: string;
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  extensionId: string;
  status: DownloadStatus;
  progress: number;          // 0-100
  totalPages?: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CreateDownloadInput {
  libraryId: string;
  extensionId: string;
  chapterIds: string[];
}

export interface DownloadedPage {
  id: string;
  downloadId: string;
  pageNumber: number;
  pageUrl: string;
  filePath: string;
  fileSize: number;
  downloadedAt: Date;
}
```

### WebSocket Events:

```typescript
// From server/src/websocket/events.ts (already defined)
export const DOWNLOAD_STARTED = 'download:started';
export const DOWNLOAD_PROGRESS = 'download:progress';
export const DOWNLOAD_PAGE_COMPLETE = 'download:page_complete';
export const DOWNLOAD_CHAPTER_COMPLETE = 'download:chapter_complete';
export const DOWNLOAD_FAILED = 'download:failed';
export const DOWNLOAD_CANCELLED = 'download:cancelled';

// Payloads
interface DownloadStartedPayload {
  downloadId: string;
  chapterId: string;
  totalPages: number;
}

interface DownloadProgressPayload {
  downloadId: string;
  progress: number;       // 0-100
  currentPage: number;
  totalPages: number;
}

interface DownloadPageCompletePayload {
  downloadId: string;
  pageNumber: number;
  totalPages: number;
}

interface DownloadChapterCompletePayload {
  downloadId: string;
  chapterId: string;
}

interface DownloadFailedPayload {
  downloadId: string;
  error: string;
}

interface DownloadCancelledPayload {
  downloadId: string;
}
```

### API Endpoints:

```typescript
GET    /api/downloads                  // Get download queue
       ?status=downloading             // Filter by status
       &libraryId=uuid                 // Filter by manga

POST   /api/downloads                  // Add chapters to download queue
       Body: {
         libraryId: string,
         extensionId: string,
         chapterIds: string[]
       }

GET    /api/downloads/:id              // Get download details

DELETE /api/downloads/:id              // Cancel download

GET    /api/downloads/stats            // Get storage statistics
       Response: {
         totalSize: number,            // Bytes
         downloadCount: number
       }
```

### Implementation Tasks:

#### 4.1 Create Download Database Schema
- Add migration v3 to `server/src/database/migrations.ts`

#### 4.2 Implement File Storage Manager
- Create `server/src/modules/downloads/storage/file-manager.ts`
- Methods:
  - `saveImage(buffer, downloadId, pageNumber)` → Save to `downloads/{downloadId}/page_{pageNumber}.{ext}`
  - `getImagePath(downloadId, pageNumber)` → Return absolute path
  - `deleteDownload(downloadId)` → Remove folder
  - `getStorageStats()` → Calculate total size

#### 4.3 Implement Download Queue Repository
- Create `server/src/modules/downloads/downloads.repository.ts`
- Methods for downloads table and downloaded_pages table

#### 4.4 Implement Chapter Downloader Service
- Create `server/src/modules/downloads/downloader.service.ts`
- Download flow:
  1. Fetch chapter pages from extension
  2. For each page:
     - Fetch image data
     - Save to disk via FileManager
     - Insert into downloaded_pages
     - Update progress
     - Emit `DOWNLOAD_PAGE_COMPLETE` event
  3. Mark download as completed
  4. Emit `DOWNLOAD_CHAPTER_COMPLETE` event
- Retry logic: 3 attempts per page with exponential backoff
- Cancellation support: Check status before each page

#### 4.5 Implement Download Service Layer
- Update `server/src/services/download.service.ts`
- Replace stubbed methods
- Queue processor:
  - Query queued downloads
  - Process up to 3 concurrent downloads
  - Auto-start on server startup

#### 4.6 Create Download API Controller & Routes
- Create `server/src/modules/downloads/downloads.controller.ts`
- Create `server/src/modules/downloads/downloads.routes.ts`
- Register routes in `server/src/app/routes.ts`

---

## Phase 5: Reader Backend APIs

**Status**: ⏳ Pending (0/4 tasks)
**Dependencies**: Phase 4 Complete ✅
**Estimated Time**: 4-6 hours

### Overview
Serve manga pages for reading (both downloaded and non-downloaded), proxy external images, handle chapter navigation.

### TypeScript Types:

```typescript
// server/src/modules/reader/reader.types.ts
export interface ReaderChapter {
  id: string;
  number: string;
  title?: string;
  pages: ReaderPage[];
  isDownloaded: boolean;
  nextChapterId?: string;
  previousChapterId?: string;
}

export interface ReaderPage {
  number: number;
  url: string;              // Local file path or external URL
  width?: number;
  height?: number;
}
```

### API Endpoints:

```typescript
GET /api/reader/:libraryId/chapters/:chapterId
    // Get chapter metadata and page list
    Response: ReaderChapter

GET /api/reader/:libraryId/chapters/:chapterId/pages/:pageNumber
    // Get page image
    // If downloaded: serve local file
    // If not downloaded: proxy from extension
    Response: Image data (JPEG/PNG/WEBP)

GET /api/reader/:libraryId/chapters/:chapterId/next
    // Get next chapter
    Response: ReaderChapter

GET /api/reader/:libraryId/chapters/:chapterId/previous
    // Get previous chapter
    Response: ReaderChapter
```

### Implementation Tasks:

#### 5.1 Implement Reader Service Layer
- Create `server/src/modules/reader/reader.service.ts`
- Methods:
  - `getChapter(libraryId, chapterId)` → Check if downloaded, return appropriate URLs
  - `getPage(downloadId, pageNumber)` → Return file path or proxy URL
  - `getNextChapter(libraryId, currentChapterId)` → Query extension for chapter list
  - `getPreviousChapter(libraryId, currentChapterId)`

#### 5.2 Implement Image Proxy Service
- Create `server/src/modules/reader/image-proxy.service.ts`
- Methods:
  - `getImage(url, referer?)` → Fetch image with proper headers
  - `streamImage(url, response)` → Stream to response
- Features:
  - Referer header support (some sites require it)
  - User-Agent spoofing
  - Response streaming (don't load entire image into memory)
  - LRU cache (max 50 images)

#### 5.3 Create Reader Controller & Routes
- Create `server/src/modules/reader/reader.controller.ts`
- Create `server/src/modules/reader/reader.routes.ts`
- Image endpoint:
  - Check if downloaded → serve local file
  - If not → proxy from extension
  - Set proper Content-Type header
  - Add caching headers

#### 5.4 Integrate Reading Progress Auto-save
- When page is viewed, auto-update progress
- Option 1: Auto-save on page view (in `getPage` endpoint)
- Option 2: Explicit progress endpoint (frontend calls)

---

## Phase 6: WebSocket Integration & Real-Time Updates

**Status**: ⏳ Pending (0/3 tasks)
**Dependencies**: Phases 4-5 Complete ✅
**Estimated Time**: 2-4 hours

### Implementation Tasks:

#### 6.1 Wire Download WebSocket Events
- Modify `server/src/modules/downloads/downloader.service.ts`
- Import emitters from `server/src/websocket/events.ts`
- Add emitter calls at appropriate times:
  - Before starting: `emitDownloadStarted()`
  - After each page: `emitDownloadPageComplete()`, `emitDownloadProgress()`
  - On completion: `emitDownloadChapterComplete()`
  - On error: `emitDownloadFailed()`
  - On cancellation: `emitDownloadCancelled()`

#### 6.2 Wire Library Update WebSocket Events
- Modify `server/src/modules/library/library.service.ts`
- Add new event types to `server/src/websocket/events.ts`:
  - `LIBRARY_ITEM_ADDED`
  - `LIBRARY_ITEM_REMOVED`
  - `LIBRARY_ITEM_UPDATED`
- Create emitter functions
- Call emitters after library operations

#### 6.3 Implement Client-to-Server WebSocket Events (Optional)
- Modify `server/src/websocket/handlers.ts`
- Implement message routing in `handleClientMessage()`
- Add room-based broadcasting:
  - Clients subscribe to specific downloads: `subscribe:download`
  - Clients unsubscribe: `unsubscribe:download`
  - Only send events to subscribed clients

---

## Technical Reference

### Database Connection
- **File**: `server/src/database/connection.ts`
- **Function**: `getDatabase()` → Returns singleton `Database.Database` instance
- **Location**: `process.env.DB_PATH` or `./data/manga.db`
- **Settings**: Foreign keys enabled via `db.pragma("foreign_keys = ON")`

### Error Types
- **File**: `server/src/shared/errors.ts`
- **Classes**:
  - `NotImplementedError` → 501 status
  - `ValidationError` → 400 status
  - `DomainError` → 400 status

### Validation Utility
- **File**: `server/src/shared/validation.ts`
- **Interface**: `Schema<T>` with `parse(data: unknown): T` method
- **Function**: `validateWithSchema<T>(schema, data): T`
- **Note**: Can use Zod, Joi, or custom validators

### Existing Patterns

#### Repository Pattern:
```typescript
class SqliteRepository {
  constructor(private readonly db: Database.Database) {}

  method(): ReturnType {
    const stmt = this.db.prepare(`SELECT ...`);
    const rows = stmt.all(params);
    return rows.map(mapRow);
  }
}

export const createRepository = (db: Database.Database) => {
  return new SqliteRepository(db);
};
```

#### Service Pattern:
```typescript
class Service {
  constructor(private readonly repository: Repository) {}

  async method(): Promise<ReturnType> {
    // Business logic here
    return this.repository.method();
  }
}
```

#### Controller Pattern:
```typescript
class Controller {
  constructor(private readonly service: Service) {}

  method = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.method();
      res.json({ result });
    } catch (error) {
      console.error('Error:', error);
      // Error handler will catch this
      throw error;
    }
  };
}
```

#### Routes Pattern:
```typescript
export const createRouter = (context: AppContext): Router => {
  const router = Router();
  const repository = createRepository(context.db);
  const service = new Service(repository);
  const controller = new Controller(service);

  router.get("/", controller.list);
  router.post("/", controller.create);

  return router;
};
```

### Prepared Statements:
```typescript
// SELECT
const stmt = db.prepare(`SELECT * FROM table WHERE id = ?`);
const row = stmt.get(id);
const rows = stmt.all(id);

// INSERT
const stmt = db.prepare(`INSERT INTO table (col1, col2) VALUES (?, ?)`);
stmt.run(val1, val2);

// UPDATE
const stmt = db.prepare(`UPDATE table SET col1 = ? WHERE id = ?`);
stmt.run(newVal, id);

// DELETE
const stmt = db.prepare(`DELETE FROM table WHERE id = ?`);
stmt.run(id);

// UPSERT
const stmt = db.prepare(`
  INSERT INTO table (id, col1) VALUES (?, ?)
  ON CONFLICT(id) DO UPDATE SET col1 = excluded.col1
`);
stmt.run(id, val);
```

### Transactions:
```typescript
const insertMany = db.transaction((items: Item[]) => {
  for (const item of items) {
    stmt.run(item.id, item.name);
  }
});

insertMany(itemsArray);  // All-or-nothing
```

---

## Development Guidelines

### Code Style
- Use `const` for all function declarations
- Name event handlers with `handle` prefix (e.g., `handleClick`)
- Use early returns for validation
- Use prepared statements for all SQL queries
- Use transactions for batch operations

### File Organization
```
server/src/
├── app/               # App initialization
├── database/          # Database connection, migrations
├── middleware/        # Express middleware
├── modules/           # Feature modules
│   ├── {module}/
│   │   ├── {module}.controller.ts
│   │   ├── {module}.service.ts
│   │   ├── {module}.repository.ts
│   │   ├── {module}.routes.ts
│   │   └── {module}.types.ts
├── services/          # Shared services (being replaced by modules)
├── shared/            # Shared utilities
└── websocket/         # WebSocket infrastructure
```

### Testing Strategy
- Manual testing via REST client (e.g., Postman, Insomnia)
- Test each endpoint after implementation
- Verify database state after operations
- Test error cases (missing fields, invalid IDs, etc.)

### Git Commit Strategy
- Commit after each completed task
- Descriptive commit messages
- Example: "feat(library): implement library repository with CRUD operations"

### Debugging
- Console logs included for all operations
- Errors logged with context (method, path, error)
- Use colored logs for visibility
- Check SQLite database directly for verification:
  ```bash
  sqlite3 data/manga.db
  .tables
  SELECT * FROM migrations;
  ```

---

## Next Steps

### Immediate (Phase 2):
1. Create extension repository schema types
2. Implement schema validator with strict checking
3. Test with example index.json files

### Short-term (Phases 3-4):
1. Implement library system (can start immediately)
2. Add migration v2 for library tables
3. Implement download system after library complete

### Long-term (Phases 5-6):
1. Reader APIs depend on downloads
2. WebSocket events wire up last
3. Frontend integration after backend complete

---

## Progress Tracking

**Last Updated**: 2025-11-11

### Completed Tasks (3/27):
- ✅ Settings Module Implementation
- ✅ Migration System
- ✅ Global Error Handling & Validation

### Current Task:
- 🔄 Extension Repository Schema Definition (Phase 2.1)

### Blockers:
- None currently

### Notes:
- Phase 1 foundation is solid and ready for building upon
- Phase 2 and Phase 3 can be developed in parallel by different developers
- Phase 4 must wait for Phase 3 (downloads depend on library)
- Phase 5 must wait for Phase 4 (reader depends on downloads)
- Phase 6 wires everything together at the end

---

**End of Document**
