# Testing Quick Start

Get up and running with JAMRA tests in 5 minutes.

---

## 1. Run Unit Tests (No Setup Required)

```bash
# Install dependencies (if you haven't already)
pnpm install

# Run unit tests
pnpm test
```

**Expected Output:**
```
✓ src/hooks/queries/useLibraryQueries.test.ts (11)
✓ src/hooks/queries/useDownloadQueries.test.ts (7)
✓ src/hooks/queries/useExtensionsQueries.test.ts (9)
✓ src/hooks/queries/useCatalogQueries.test.ts (3)
✓ src/hooks/queries/useInstallerQueries.test.ts (3)

Test Files  5 passed (5)
Tests  33 passed (33)
```

---

## 2. Run Integration Tests (Requires Backend)

### Terminal 1: Start Backend

```bash
pnpm dev:server
```

Wait for:
```
Server running at http://localhost:3000
Database connected
```

### Terminal 2: Run Tests

```bash
pnpm test:integration
```

**Expected Output:**
```
✓ src/hooks/queries/useSettingsQueries.integration.test.ts (3)
✓ src/hooks/queries/useLibraryQueries.integration.test.ts (4)
✓ src/hooks/queries/useExtensionsQueries.integration.test.ts (2)
✓ src/hooks/queries/useDownloadQueries.integration.test.ts (2)

Test Files  4 passed (4)
Tests  11 passed (11)
```

---

## 3. View Tests in Browser UI

```bash
# Unit tests UI
pnpm vitest -- --ui

# Integration tests UI (start backend first!)
pnpm vitest -- --config vitest.integration.config.ts --ui
```

Opens browser at `http://localhost:51204/__vitest__/`

---

## Common Commands

```bash
# Unit tests (fast, mocked)
pnpm vitest        # Watch mode
pnpm vitest -- --ui           # Browser UI
pnpm test              # Run once
pnpm test -- --coverage     # With coverage

# Integration tests (real backend)
pnpm vitest -- --config vitest.integration.config.ts --watch  # Watch mode
pnpm vitest -- --config vitest.integration.config.ts --ui     # Browser UI
pnpm test:integration        # Run once
```

---

## Troubleshooting

### Unit Tests Fail

**Check:**
1. Dependencies installed: `pnpm install`
2. No syntax errors in test files
3. MSW handlers in `src/test/mocks/handlers.ts`

**Common Fix:**
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm test
```

### Integration Tests Fail

**Check:**
1. Backend is running: `pnpm dev:server`
2. Health check passes: `curl http://localhost:3000/health`
3. Database exists: `ls data/jamra.db`

**Common Fix:**
```bash
# Terminal 1
pkill -f "tsx watch"  # Kill any existing servers
rm -rf data/jamra.db  # Fresh database
pnpm dev:server       # Restart

# Terminal 2
pnpm test:integration
```

### "Cannot find module" Error

**Fix TypeScript paths:**
```bash
# Check tsconfig.json exists
cat tsconfig.json

# Rebuild
pnpm build:frontend
```

---

## Next Steps

- **[Complete Testing Guide](../README.testing.md)** - Full documentation
- **[Integration Guide](./testing-integration-guide.md)** - Deep dive on integration tests
- **[API Contracts](./frontend-api-contracts.md)** - API reference

---

**Ready to write tests?** Check the templates in [README.testing.md](../README.testing.md)!
