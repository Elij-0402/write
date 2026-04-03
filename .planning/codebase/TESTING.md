# Testing Patterns

**Analysis Date:** 2026-04-03

## Test Framework

**Runner:**
- Vitest 4.1.2
- Config: `vitest.config.ts`
- Uses globals: true (describe, it, expect available without import)

**Assertion Library:**
- Vitest built-in expect

**Run Commands:**
```bash
npm test              # Not configured in package.json scripts
npx vitest             # Run all tests
npx vitest --watch     # Watch mode
```

## Test File Organization

**Location:**
- `__tests__/` directory in project root
- Mirrors source structure: `__tests__/lib/ai/context-assembler.test.ts`
- NOT co-located with source files

**Naming:**
- `*.test.ts` suffix

**Structure:**
```
__tests__/
├── lib/
│   ├── ai/
│   │   └── context-assembler.test.ts
│   └── utils/
│       └── tiptap.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe('functionName', () => {
  it('does X when Y', () => {
    const result = functionUnderTest(input)
    expect(result).toBe(expected)
  })

  it('handles edge case Z', () => {
    ...
  })
})
```

**Patterns:**
- One describe block per function
- Multiple it blocks per describe covering cases
- No beforeAll/afterAll/beforeEach/afterEach in current tests

## Mocking

**Framework:** Vitest built-in mocking

**Current Approach:**
- No mocking found in existing tests
- Tests use real implementations
- Tests are purely unit tests of pure functions

**Mock Files:** None present

## Fixtures and Factories

**Test Data:**
- Inline test data in each test case
- Chinese text used for realistic testing (林黛玉, 贾宝玉)
- JSON fixtures for Tiptap JSON structure

**Examples:**
```typescript
// Chinese text fixture
const text = '林黛玉走进了大观园，看到了贾宝玉在亭子里读书。'

// Tiptap JSON fixture
const json = JSON.stringify({
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{ type: 'text', text: '你好世界' }],
  }],
})
```

## Coverage

**Requirements:** None enforced

**View Coverage:** Not configured

## Test Types

**Unit Tests:**
- Pure functions tested in isolation
- No dependencies on external services
- Examples: `scanCharacterNames`, `estimateTokens`, `getTokenBudget`, `extractTextFromJson`

**Integration Tests:**
- Not present in current codebase

**E2E Tests:**
- Not configured

## Common Patterns

**Async Testing:**
```typescript
// Current tests are synchronous
// No async/await patterns in existing tests
```

**Error Testing:**
```typescript
it('invalid JSON → empty string', () => {
  expect(extractTextFromJson('not valid json {')).toBe('')
})
```

**Parameterized Tests:**
```typescript
const taskTypes: TaskType[] = ['write', 'rewrite', 'brainstorm', 'consistency']

it.each(taskTypes)('allocates budget for task type: %s', (taskType) => {
  const budget = getTokenBudget(taskType)
  ...
})
```

## Testing Limitations

**Not Tested:**
- React components (no component tests)
- API routes
- Database operations (Supabase queries)
- Zustand stores
- Context providers
- Custom hooks (useAiTools, useChapterEditor)

**Test Gaps:**
- No test for `assembleContext` (requires Supabase mock)
- No component rendering tests
- No integration tests
- No E2E tests

---

*Testing analysis: 2026-04-03*
