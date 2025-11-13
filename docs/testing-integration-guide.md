# Integration Testing Guide

This guide explains how to run integration tests that hit the real backend server and database.

---

## Overview

JAMRA has two types of tests:

1. **Unit Tests** (MSW-mocked) - Fast, isolated tests using mock API responses
2. **Integration Tests** (Real backend) - Tests that hit the actual running server

---

## Setup Requirements

### 1. Start the Backend Server

Integration tests require the backend server to be running:

```bash
# In one terminal, start the server
pnpm dev:server
```

The server should be running at `http://localhost:3000`

### 2. Ensure Database is Ready

The backend uses SQLite. The database will be automatically created on first run at:
- Development: `./data/jamra.db`

For clean test runs, you may want to start with a fresh database:

```bash
# Stop the server first, then remove the database
rm -rf ./data/jamra.db

# Restart the server to create a fresh database
pnpm dev:server
```

---

## Running Integration Tests

### Watch Mode (Recommended during development)

```bash
pnpm test:integration
```

- Watches for file changes
- Re-runs tests automatically
- Useful for TDD workflow

### UI Mode (Interactive)

```bash
pnpm test:integration:ui
```

- Opens browser-based test UI
- Visual test results
- Detailed logs and debugging

### Run Once (CI/Production)

```bash
pnpm test:integration:run
```

- Runs all tests once
- Exits with status code
- Suitable for CI pipelines

---

## Test Structure

Integration tests are in the same directories as the hooks they test, with `.integration.test.ts` suffix:

```
src/hooks/queries/
├── useLibraryQueries.ts
├── useLibraryQueries.test.ts          # Unit tests (MSW)
├── useLibraryQueries.integration.test.ts  # Integration tests (real backend)
├── useExtensionsQueries.ts
├── useExtensionsQueries.integration.test.ts
└── ...
```

---

## What Integration Tests Cover

### Settings Tests
- Fetch all settings from database
- Filter settings by scope
- Create/update settings
- Delete settings
- Verify persistence across requests

### Extensions Tests
- List installed extensions
- Fetch extension details
- Verify extension manifest loading
- Test 404 for non-existent extensions

### Library Tests
- List library items
- Filter by status (reading, completed, etc.)
- Filter by favorite status
- Add items to library
- Update item status
- Toggle favorite
- Remove items
- Fetch library statistics

### Downloads Tests
- List download queue
- Filter downloads by status
- Fetch download statistics
- Verify disk usage calculations

---

## Test Data Management

### Test Isolation

Each test suite manages its own data:

```typescript
describe("Library Integration Tests", () => {
  let testLibraryId: string | null = null;

  afterEach(async () => {
    // Cleanup: remove test data
    if (testLibraryId) {
      await removeFromLibrary(testLibraryId);
      testLibraryId = null;
    }
  });
});
```

### Conditional Tests

Some tests are skipped if prerequisites aren't met:

```typescript
it("tests extension search", async () => {
  const extensions = await getExtensions();

  if (extensions.length === 0) {
    console.warn("No extensions installed - skipping test");
    return;
  }

  // Run test with first extension
});
```

---

## Debugging Integration Tests

### View Server Logs

While tests run, watch the server terminal for:
- Request logs
- Database queries
- Error messages
- Extension execution logs

### Use Console Logs

Integration tests include helpful logging:

```typescript
it("fetches library", async () => {
  const { data } = await fetchLibrary();
  console.log(`Found ${data.items.length} library items`);
  // ...
});
```

### Increase Timeout

For slow operations:

```typescript
await waitFor(() => expect(result.isSuccess).toBe(true), {
  timeout: 10000, // 10 seconds
});
```

### Check Database Directly

SQLite browser tools can help debug:

```bash
# Install sqlite3
npm install -g sqlite3

# Open database
sqlite3 ./data/jamra.db

# Query library
SELECT * FROM library;

# Query settings
SELECT * FROM settings;
```

---

## Common Issues

### "Connection Refused" Error

**Problem:** Tests can't reach backend

**Solution:**
```bash
# Ensure backend is running
pnpm dev:server

# Check it's accessible
curl http://localhost:3000/health
```

### "Timeout" Errors

**Problem:** Requests taking too long

**Possible Causes:**
1. Backend is slow (check server logs)
2. Database is locked
3. Extension is making slow external requests

**Solutions:**
- Increase test timeout
- Check server performance
- Restart backend server

### "404 Not Found" Errors

**Problem:** Endpoint doesn't exist

**Solutions:**
1. Verify backend is latest version
2. Check API_PATHS constants match backend routes
3. Review backend docs for correct endpoints

### Data Persistence Between Tests

**Problem:** Tests affecting each other

**Solution:** Ensure cleanup in `afterEach`:

```typescript
afterEach(async () => {
  // Clean up all test data
  await cleanupTestData();
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Build server
        run: pnpm build:server

      - name: Start server
        run: |
          pnpm dev:server &
          sleep 5  # Wait for server to start

      - name: Run integration tests
        run: pnpm test:integration:run

      - name: Stop server
        run: pkill -f "tsx watch"
```

---

## Best Practices

### 1. Always Clean Up Test Data

```typescript
afterEach(async () => {
  // Remove test entries
  if (testId) await deleteTestData(testId);
});
```

### 2. Use Descriptive Test Names

```typescript
// Good
it("fetches library items and filters by reading status", async () => {});

// Bad
it("works", async () => {});
```

### 3. Test Happy Path and Error Cases

```typescript
it("successfully adds item to library", async () => {
  // Test success
});

it("returns 404 for non-existent item", async () => {
  // Test error handling
});
```

### 4. Don't Assume Data Exists

```typescript
// Bad
const firstExtension = extensions[0]; // Might not exist!

// Good
if (extensions.length === 0) {
  console.warn("No extensions installed");
  return;
}
const firstExtension = extensions[0];
```

### 5. Keep Tests Independent

Each test should work in isolation and not depend on other tests running first.

---

## Performance Tips

### Run Specific Test Files

```bash
# Only run library tests
pnpm test:integration useLibraryQueries

# Only run settings tests
pnpm test:integration useSettingsQueries
```

### Parallel Execution

Vitest runs tests in parallel by default. To run serially:

```bash
pnpm test:integration:run --no-threads
```

### Reduce Database I/O

- Use transactions for multiple operations
- Batch inserts/updates when possible
- Clean database between test runs

---

## Comparison: Unit vs Integration Tests

| Aspect | Unit Tests (MSW) | Integration Tests (Real Backend) |
|--------|------------------|----------------------------------|
| **Speed** | Very fast (<1s) | Slower (2-10s per test) |
| **Setup** | No backend needed | Requires running server |
| **Database** | Not used | Real database |
| **Network** | Mocked | Real HTTP calls |
| **Isolation** | Complete | Requires cleanup |
| **Use Case** | Component logic, API contracts | End-to-end workflows, real data |

**Recommendation:** Use both! Unit tests for fast feedback during development, integration tests for confidence before deployment.

---

## Next Steps

1. Run integration tests locally: `pnpm test:integration`
2. Review failing tests and fix issues
3. Add integration tests for new features
4. Set up CI/CD pipeline with integration tests
5. Monitor test performance and optimize as needed

---

For questions or issues, see the main [Testing Setup Summary](./testing-setup-summary.md) or open an issue on GitHub.
