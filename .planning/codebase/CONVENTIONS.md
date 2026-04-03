# Coding Conventions

**Analysis Date:** 2026-04-03

## Naming Patterns

**Files:**
- Components/UI: kebab-case with descriptive names (e.g., `alert-dialog.tsx`, `side-panel.tsx`)
- Utilities/Library: snake_case or descriptive names (e.g., `tiptap.ts`, `context-assembler.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useAiTools.ts`, `useChapterEditor.ts`)
- Stores: kebab-case (e.g., `editor-store.ts`)
- Types: co-located in `types/database.ts`
- Tests: `.test.ts` suffix, co-located in `__tests__/` directory

**Functions:**
- camelCase for all functions and variables
- Event handlers prefixed with `handle` (e.g., `handleToolClick`, `handleBrainstormSubmit`)
- Custom hooks prefixed with `use` (e.g., `useEditor`, `useChapterEditor`)

**Variables:**
- camelCase: `activeTool`, `aiContent`, `brainstormInput`
- Type annotations for complex objects
- Refs suffixed with `Ref` (e.g., `abortRef`, `editorRef`, `saveTimerRef`)

**Types/Interfaces:**
- PascalCase for types and interfaces
- Database types exported from `types/database.ts`
- Component prop interfaces use `Props` suffix or inline for simple cases

## Code Style

**Formatting:**
- Tool: Next.js defaults (no explicit Prettier config found)
- Tab width: 2 spaces (Tailwind default)
- Single quotes for strings

**Linting:**
- Tool: ESLint with `eslint-config-next`
- Config: Uses Next.js default rules, no custom `.eslintrc`
- Command: `npm run lint`

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- `noEmit: true` - type checking only
- `isolatedModules: true`
- Path alias: `@/*` maps to project root

## Import Organization

**Order:**
1. React imports (`react`, `next/*`)
2. Third-party library imports (`@supabase/*`, `@tiptap/*`, `@radix-ui/*`, `lucide-react`)
3. Internal imports (`@/lib/*`, `@/components/*`, `@/hooks/*`, `@/stores/*`, `@/types/*`)
4. Relative imports (only when `@/` alias not applicable)

**Path Aliases:**
- `@/` - project root (e.g., `@/lib/utils`, `@/components/ui/button`)

**Examples:**
```typescript
import { useState, useCallback } from 'react'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
```

## Error Handling

**API Routes:**
```typescript
export async function POST(req: Request) {
  try {
    // validation
    if (!chapterId) {
      return NextResponse.json({ error: '缺少章节 ID' }, { status: 400 })
    }
    // auth check
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // business logic...
  } catch (err: any) {
    console.error('AI write error:', err)
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
```

**Client-Side:**
- Error state managed via `useState` (e.g., `aiError`)
- `AbortController` for cancellation
- Try-catch with specific error type checking

**Library Code:**
- Throws errors with descriptive messages
- No silent failures
- Token estimation returns 0 for empty input

## Logging

**Framework:** console (no dedicated logging library)

**Patterns:**
- API routes: `console.error` for errors (never `console.log`)
- Library code: `console.warn` for recoverable issues (e.g., query failures)
- Client hooks: No logging, user-facing error state instead

## Comments

**When to Comment:**
- Chinese comments for business logic (this is a Chinese-language project)
- Complex token calculation logic explained
- TODO: No TODO/FIXME comments found in codebase

**JSDoc/TSDoc:**
- Minimal usage
- TypeScript types provide documentation

**Examples:**
```typescript
// 同步外部内容变化（如章节切换）
useEffect(() => { ... }, [content, editor])

// 暴露 editor 实例用于外部插入
useEffect(() => { ... }, [editor, editorRef])
```

## Function Design

**Size:** Small, focused functions preferred

**Parameters:**
- Max 4-5 parameters before considering options object
- Destructuring for complex props
- Explicit type annotations

**Return Values:**
- Async functions return Promises
- No implicit undefined returns

## Module Design

**Exports:**
- Named exports preferred
- Single default export per module for React components
- Custom hooks always named exports

**Barrel Files:**
- No barrel files (`index.ts`) found
- Direct imports from source files

**React Components:**
- Server components: No `'use client'` directive
- Client components: `'use client'` at top
- ForwardRef for component refs
- Display name set for debugging

**State Management:**
- Zustand for global state (e.g., `useEditorStore`)
- React useState for local component state
- Refs for mutable values that don't trigger renders

---

*Convention analysis: 2026-04-03*
