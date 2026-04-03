# Architecture

**Analysis Date:** 2026-04-03

## Pattern Overview

**Overall:** Next.js App Router with Client-Server Separation

**Key Characteristics:**
- Next.js 14 App Router with route groups `(app)` and `(auth)` for layout separation
- Server Components by default, Client Components marked with `'use client'`
- API Routes in `app/api/` handle server-side logic
- Supabase for auth and database (PostgreSQL)
- Zustand for client-side state management
- Tiptap for rich text editing

## Layers

**UI Layer (Client Components):**
- Purpose: User interface and interaction handling
- Location: `app/(app)/` pages, `components/`
- Contains: React pages, UI components, event handlers
- Depends on: Hooks, Zustand stores, Supabase client
- Used by: Browser rendering

**API Layer (Route Handlers):**
- Purpose: Backend endpoints for data operations and AI
- Location: `app/api/` route files
- Contains: REST endpoints for CRUD on projects, chapters, characters, worldbuilding, AI tools
- Depends on: Supabase server client, AI provider
- Used by: Client components via fetch

**Data Access Layer:**
- Purpose: Supabase client wrappers for database operations
- Location: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Contains: Browser and server Supabase client factories
- Depends on: `@supabase/supabase-js`
- Used by: API routes, client components

**AI Layer:**
- Purpose: AI text generation with context assembly
- Location: `lib/ai/`
- Contains: `provider.ts` (interface), `deepseek.ts` (implementation), `context-assembler.ts`
- Depends on: DeepSeek API
- Used by: API routes (`app/api/ai/*`)

**State Layer:**
- Purpose: Client-side state management
- Location: `stores/editor-store.ts`, React Context in `components/providers.tsx`
- Contains: Editor content/word count, user session
- Depends on: Zustand, React Context
- Used by: Client components

**Prompt Layer:**
- Purpose: AI prompt templates
- Location: `lib/prompts/` (`write.ts`, `rewrite.ts`, `brainstorm.ts`, `consistency.ts`)
- Contains: Prompt builders for AI tasks
- Depends on: Context assembly output
- Used by: AI API routes

**Type Layer:**
- Purpose: TypeScript type definitions
- Location: `types/database.ts`
- Contains: Supabase database types, entity types
- Depends on: None
- Used by: Throughout codebase

## Data Flow

**Page Request Flow:**
1. User requests route
2. Middleware (`middleware.ts`) checks auth status via Supabase cookies
3. Unauthorized users redirect to `/login`
4. Authorized users access protected routes
5. Server Components fetch initial data from Supabase
6. Client Components render with data

**Chapter Editing Flow:**
1. `ChapterEditorPage` (`app/(app)/[projectId]/[chapterId]/page.tsx`) mounts
2. `useChapterEditor` hook loads chapter from Supabase
3. `TiptapEditor` renders with content
4. User types, debounced auto-save (2s) updates Supabase
5. `useAiTools` handles AI tool requests

**AI Write Flow:**
1. User clicks "write" in `WritingCockpit`
2. `useAiTools.handleToolClick('write')` called
3. Fetch POST to `/api/ai/write` with chapterId and cursorPosition
4. API route calls `assembleContext()` to gather characters, worldbuilding, style guide
5. Prompt built via `buildWritePrompt()`
6. `getAIProvider().complete()` calls DeepSeek API
7. Response returned to client, displayed in panel
8. User clicks "insert", content inserted at cursor via Tiptap commands

## Key Abstractions

**AI Provider Interface:**
- Purpose: Abstraction for AI text generation
- Examples: `lib/ai/deepseek.ts`
- Pattern: Strategy pattern with `AIProvider` interface
```typescript
export interface AIProvider {
  complete(prompt: string, options?: { max_tokens?: number; temperature?: number }): Promise<string>
}
```

**Context Assembler:**
- Purpose: Gather relevant context for AI prompts from database
- Examples: `lib/ai/context-assembler.ts`
- Pattern: Token budget allocation for text window, characters, worldbuilding, style guide

**Supabase Client Factory:**
- Purpose: Create Supabase clients for browser/server contexts
- Examples: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Pattern: Factory functions returning configured clients

**Zustand Editor Store:**
- Purpose: Manage editor state across components
- Examples: `stores/editor-store.ts`
- Pattern: Simple Zustand store with content, wordCount, saveStatus

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Root HTML structure, font loading, global CSS

**App Layout (Protected):**
- Location: `app/(app)/layout.tsx`
- Triggers: Any route under `(app)` group
- Responsibilities: TopBar, MobileMenu, SidePanel, auth state loading

**Auth Layout:**
- Location: `app/(auth)/layout.tsx`
- Triggers: `/login`, `/register` routes
- Responsibilities: Centered auth page layout

**Middleware:**
- Location: `middleware.ts`
- Triggers: Every request
- Responsibilities: Auth cookie management, route protection

## Error Handling

**Strategy:** Error boundaries with try-catch in async operations

**Patterns:**
- API routes return JSON errors with status codes
- Client components display error state in UI
- AI errors caught and shown in `SidePanel` via `aiError` state
- AbortController used to cancel in-flight AI requests

## Cross-Cutting Concerns

**Authentication:** Supabase Auth with cookies, middleware-based route protection

**Logging:** Minimal - only `console.error` for AI errors in API routes

**Validation:** Basic validation in API routes (check for required IDs), client-side form validation

**Styling:** Tailwind CSS with CSS variables from `globals.css`

---

*Architecture analysis: 2026-04-03*
