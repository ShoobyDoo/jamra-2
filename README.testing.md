# JAMRA Testing Guide

Complete guide for running tests in the JAMRA application.

---

## Quick Start

### Unit Tests (MSW Mocked)
```bash
# Watch mode
pnpm test

# UI mode
pnpm test:ui

# Run once
pnpm test:run

# With coverage
pnpm test:coverage
```

### Integration Tests (Real Backend)
```bash
# IMPORTANT: Start backend server first!
pnpm dev:server

# Then in another terminal:
pnpm test:integration

# UI mode
pnpm test:integration:ui

# Run once
pnpm test:integration:run
```

---

## Test Types

### 1. Unit Tests (`*.test.ts`)

**Purpose:** Fast, isolated testing with mocked API responses

**Technology:**
- Vitest (test runner)
- MSW (Mock Service Worker)
- Testing Library

**Location:** `src/**/*.test.ts`

**Benefits:**
- ⚡ Very fast (<10s for all tests)
- 🔒 No backend required
- 📦 Complete isolation
- 🎯 Tests component/hook logic

**Run:**
```bash
pnpm test
```

**Example:**
```typescript
// src/hooks/queries/useLibraryQueries.test.ts
it('fetches library list successfully', async () => {
  const { result } = renderHook(() => useLibraryList());

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data?.items).toHaveLength(2);
});
```

### 2. Integration Tests (`*.integration.test.ts`)

**Purpose:** End-to-end testing with real backend and database

**Technology:**
- Vitest (test runner)
- Real HTTP requests
- Actual database operations

**Location:** `src/**/*.integration.test.ts`

**Benefits:**
- 🔍 Real API validation
- 💾 Database verification
- 🌐 Network testing
- ✅ Production confidence

**Run:**
```bash
# Terminal 1: Start backend
pnpm dev:server

# Terminal 2: Run tests
pnpm test:integration
```

**Example:**
```typescript
// src/hooks/queries/useLibraryQueries.integration.test.ts
it('fetches library list from real backend', async () => {
  const { result } = renderHook(() => useLibraryList());

  await waitFor(() => expect(result.current.isSuccess).toBe(true), {
    timeout: 5000,
  });

  expect(result.current.data?.items).toBeDefined();
  expect(Array.isArray(result.current.data?.items)).toBe(true);
});
```

---

## Test Coverage

### Current Test Suites

#### Unit Tests (MSW)
- ✅ Library queries (11 tests)
- ✅ Download queries (7 tests)
- ✅ Extensions queries (9 tests)
- ✅ Catalog queries (3 tests)
- ✅ Installer queries (3 tests)

**Total:** 33 unit tests

#### Integration Tests (Real Backend)
- ✅ Settings CRUD operations
- ✅ Library management and filtering
- ✅ Extensions listing and details
- ✅ Downloads queue and stats

**Total:** 15+ integration tests

---

## Configuration Files

### Unit Tests
- **Config:** `vitest.config.ts`
- **Setup:** `src/test/setup.ts`
- **Utilities:** `src/test/utils.tsx`
- **Mocks:** `src/test/mocks/`

### Integration Tests
- **Config:** `vitest.integration.config.ts`
- **Setup:** `src/test/integration-setup.ts`
- **Utilities:** `src/test/integration-utils.tsx`

---

## Running Specific Tests

### By File Name
```bash
# Unit tests
pnpm test useLibraryQueries

# Integration tests
pnpm test:integration useLibraryQueries
```

### By Test Name
```bash
# Match test description
pnpm test -t "fetches library"
```

### Watch Specific Files
```bash
pnpm test src/hooks/queries/useLibraryQueries.test.ts
```

---

## Debugging Tests

### 1. Use Vitest UI
```bash
pnpm test:ui
```
Opens browser interface with:
- Visual test results
- Detailed error messages
- Console logs
- Test reruns

### 2. Add Debug Logs
```typescript
it('my test', async () => {
  const { result } = renderHook(() => useLibrary());

  console.log('Data:', result.current.data);
  console.log('Error:', result.current.error);

  // Your assertions...
});
```

### 3. Increase Timeout
```typescript
await waitFor(() => expect(result.isSuccess).toBe(true), {
  timeout: 10000, // 10 seconds
});
```

### 4. Check MSW Handlers
```typescript
// src/test/mocks/handlers.ts
http.get('/api/library', ({ request }) => {
  console.log('MSW: Library request received', request.url);
  return HttpResponse.json({ items: mockLibraryItems });
}),
```

### 5. Backend Logs (Integration Tests)
Watch the server terminal while running integration tests to see:
- API requests
- Database queries
- Extension execution
- Error messages

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:run

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build:server
      - run: pnpm dev:server &
      - run: sleep 5
      - run: pnpm test:integration:run
```

---

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHook } from '../../test/utils';
import { useMyQuery } from './useMyQuery';
import { createTestQueryClient } from '../../test/utils';

describe('My Query Hook', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useMyQuery(), { queryClient });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHook } from '../../test/integration-utils';
import { useMyQuery } from './useMyQuery';
import { createIntegrationQueryClient } from '../../test/integration-utils';

describe('My Query Integration Tests', () => {
  let queryClient;
  let testDataId = null;

  beforeEach(() => {
    queryClient = createIntegrationQueryClient();
  });

  afterEach(async () => {
    // Cleanup test data
    if (testDataId) {
      await deleteTestData(testDataId);
      testDataId = null;
    }
  });

  it('fetches data from real backend', async () => {
    const { result } = renderHook(() => useMyQuery(), { queryClient });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 5000,
    });

    expect(result.current.data).toBeDefined();
  });
});
```

---

## Troubleshooting

### Unit Tests

#### "No QueryClient set"
**Fix:** Ensure you're using `renderHook` from test utils:
```typescript
import { renderHook } from '../../test/utils';
```

#### "MSW handler not found"
**Fix:** Add handler to `src/test/mocks/handlers.ts`:
```typescript
http.get(`${BASE_URL}/api/my-endpoint`, () => {
  return HttpResponse.json({ data: mockData });
}),
```

### Integration Tests

#### "Connection Refused"
**Fix:** Start the backend server:
```bash
pnpm dev:server
```

#### "Timeout Error"
**Fix:** Increase timeout or check server logs:
```typescript
await waitFor(() => expect(result.isSuccess).toBe(true), {
  timeout: 10000,
});
```

#### "Database Lock"
**Fix:** Ensure only one server instance is running:
```bash
# Kill existing processes
pkill -f "tsx watch"

# Restart server
pnpm dev:server
```

---

## Best Practices

### ✅ Do

1. **Write both unit and integration tests** for critical features
2. **Clean up test data** in `afterEach` blocks
3. **Use descriptive test names** that explain what's being tested
4. **Test happy paths AND error cases**
5. **Keep tests independent** - no test should depend on another
6. **Use proper TypeScript types** for test data
7. **Add console.logs** for debugging (remove before commit)

### ❌ Don't

1. **Don't skip cleanup** - always remove test data
2. **Don't assume data exists** - check arrays before accessing
3. **Don't hardcode IDs** - use dynamic test data
4. **Don't commit focused tests** (`it.only`, `describe.only`)
5. **Don't test implementation details** - test behavior
6. **Don't make tests dependent** on execution order
7. **Don't commit debug logs** - clean them up

---

## Performance Tips

### Speed Up Unit Tests
```bash
# Run in parallel (default)
pnpm test

# Run specific file only
pnpm test useLibraryQueries
```

### Speed Up Integration Tests
```bash
# Use existing database instead of recreating
# Keep server running between test runs
# Run specific test files only
pnpm test:integration useSettingsQueries
```

### Optimize MSW Handlers
- Return minimal data needed for tests
- Avoid complex transformations in handlers
- Use constants for repeated data

---

## Documentation

- **[Frontend API Contracts](./docs/frontend-api-contracts.md)** - Complete API reference
- **[Integration Testing Guide](./docs/testing-integration-guide.md)** - Detailed integration test guide
- **[Testing Setup Summary](./docs/testing-setup-summary.md)** - Infrastructure overview
- **[Frontend Gap Plan](./docs/frontend-gap-implementation-plan.md)** - Implementation roadmap

---

## Summary

| Test Type | Command | Speed | Requirements | Use Case |
|-----------|---------|-------|--------------|----------|
| Unit | `pnpm test` | Fast | None | Development TDD |
| Integration | `pnpm test:integration` | Slower | Backend running | Pre-deployment validation |
| Coverage | `pnpm test:coverage` | Fast | None | Coverage reports |
| UI Mode | `pnpm test:ui` | Interactive | None | Debugging |

**Recommendation:** Run unit tests frequently during development, run integration tests before commits/PRs.

---

## Next Steps

1. ✅ Run unit tests: `pnpm test`
2. ✅ Start backend: `pnpm dev:server`
3. ✅ Run integration tests: `pnpm test:integration`
4. 📝 Add tests for new features
5. 🔄 Set up CI/CD pipeline
6. 📊 Monitor coverage: `pnpm test:coverage`

---

**Happy Testing! 🧪**
