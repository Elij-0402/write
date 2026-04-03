# Codebase Concerns

**Analysis Date:** 2026-04-03

## Tech Debt

### AI Context Matching - Exact String Only
- **Issue:** `scanCharacterNames` in `lib/ai/context-assembler.ts` uses exact regex matching. Cannot handle aliases, nicknames, pronouns, or same character with multiple names.
- **Files:** `lib/ai/context-assembler.ts`
- **Impact:** AI write/rewrite may not include relevant character context if author uses variations of names.
- **Fix approach:** TODOS.md P2 documents this as vector retrieval upgrade (pgvector). Requires embedding model integration.

### Consistency Check - No Ignore Feedback Loop
- **Issue:** "Ignore" action on consistency conflicts is not persisted. Same false positives reported every check.
- **Files:** `app/api/ai/consistency-check/route.ts`, `components/writing-cockpit.tsx`
- **Impact:** Noise increases over time as authors intentionally deviate from character traits (character growth).
- **Fix approach:** TODOS.md P3 documents this. Needs `consistency_ignores` table to store chapter_id + conflict_hash.

### DeepSeek-Only AI Provider
- **Issue:** `getAIProvider()` in `lib/ai/deepseek.ts` creates DeepSeek provider only. `ai_model_preference` field in `profiles` table is unused.
- **Files:** `lib/ai/deepseek.ts`, `types/database.ts`
- **Impact:** Users cannot use alternative AI models even if they prefer them.
- **Fix approach:** Abstract provider selection based on user preference.

### Token Budget Estimation Inaccuracy
- **Issue:** `estimateTokens` in `lib/ai/context-assembler.ts` uses rough formula (Chinese 1.5x, English 0.75x per word). Not accurate for all models.
- **Files:** `lib/ai/context-assembler.ts`
- **Impact:** Context may overflow or underfill token budgets unpredictably.
- **Fix approach:** Use tiktoken or equivalent for accurate counting, or reserve buffer tokens.

## Known Bugs

### Mode Cast to `any` in SidePanel
- **Symptoms:** `mode` prop passed as `mode={activeTool as any}` in `app/(app)/layout.tsx`
- **Files:** `app/(app)/layout.tsx` (line 67)
- **Trigger:** Click any AI tool (write/rewrite/brainstorm)
- **Workaround:** TypeScript will still compile, but type safety is compromised.

### Consistency Result Uses Untyped `any`
- **Symptoms:** `setConsistencyResult(data)` where data structure is not validated against a type.
- **Files:** `app/(app)/[projectId]/[chapterId]/page.tsx` (lines 22, 34)
- **Trigger:** Run consistency check
- **Workaround:** If AI returns unexpected structure, rendering may break.

## Security Considerations

### No Rate Limiting on AI Endpoints
- **Risk:** Users could spam AI endpoints, causing unexpected API costs.
- **Files:** `app/api/ai/write/route.ts`, `app/api/ai/rewrite/route.ts`, `app/api/ai/brainstorm/route.ts`, `app/api/ai/consistency-check/route.ts`
- **Current mitigation:** None
- **Recommendations:** Add rate limiting middleware for `/api/ai/*` routes.

### Authorization Inconsistency in API Routes
- **Risk:** Some routes may not properly verify resource ownership.
- **Files:** `app/api/characters/route.ts`, `app/api/worldbuilding/route.ts`, `app/api/chapters/route.ts`
- **Current mitigation:** Auth check present, but project ownership not verified on all mutations.
- **Recommendations:** Add explicit project ownership verification to all resource routes.

### No CSRF Protection
- **Risk:** CSRF attacks on authenticated API requests.
- **Files:** All API routes
- **Current mitigation:** Supabase handles auth tokens, but explicit CSRF tokens not implemented.
- **Recommendations:** Consider adding CSRF tokens for state-changing operations.

## Performance Bottlenecks

### Large Text Window Extraction
- **Problem:** `truncateToTokenBudget` in `lib/ai/context-assembler.ts` slices text by character count, not by actual tokens. Full text is still fetched.
- **Files:** `lib/ai/context-assembler.ts` (line 113)
- **Cause:** Database returns full chapter content, then slicing happens in application layer.
- **Improvement path:** Use Supabase RPC with server-side tokenization for efficient text window retrieval.

### No Debounced/Optimistic Updates for Lists
- **Problem:** Character, worldbuilding, and chapter CRUD operations refetch entire lists after mutation.
- **Files:** `app/(app)/[projectId]/characters/page.tsx`, `app/(app)/[projectId]/worldbuilding/page.tsx`, `app/(app)/[projectId]/page.tsx`
- **Cause:** Simple fetch-after-mutation pattern with no optimistic updates.
- **Improvement path:** Use optimistic updates with invalidation, or at minimum debounce rapid changes.

### AI Request Cancellation Memory Leak Potential
- **Problem:** `abortRef` in `hooks/use-ai-tools.ts` creates new AbortController but old one may not be properly garbage collected.
- **Files:** `hooks/use-ai-tools.ts` (lines 15-18)
- **Cause:** `abortPrevious()` creates new controller and aborts old, but browser may hold references.
- **Improvement path:** Wrap in try/catch and verify cleanup in useEffect return.

## Fragile Areas

### Context Assembler Query Failures Silently Continue
- **Files:** `lib/ai/context-assembler.ts` (lines 118-131)
- **Why fragile:** Each query has its own `.then()` error handler that returns `{ data: null }`, so one failed query does not stop others or signal overall failure.
- **Safe modification:** Ensure callers check if returned context has expected data before using.
- **Test coverage:** Not tested with partial query failures.

### Tiptap Editor JSON Parse on Every Sync
- **Files:** `components/editor/tiptap-editor.tsx` (lines 29, 51)
- **Why fragile:** `JSON.parse(content)` is called in `useEffect` on every content change from external source. Invalid JSON will silently set empty content.
- **Safe modification:** Validate JSON structure before passing to editor.
- **Test coverage:** Not tested with malformed JSON.

### Project/Chapters Relationship Cascade
- **Files:** `app/api/projects/[id]/route.ts` (DELETE), database schema
- **Why fragile:** Deleting a project may not cascade delete chapters, characters, or worldbuilding entries.
- **Safe modification:** Verify database RLS policies or triggers handle cascade.
- **Test coverage:** Not tested at API level.

### SidePanel Component Mount/Unmount
- **Files:** `components/side-panel.tsx` (line 21)
- **Why fragile:** Sheet returns `null` when not open instead of using CSS visibility/opacity. Causes layout recalculations.
- **Safe modification:** Use CSS-based show/hide with proper transitions.

## Test Coverage Gaps

### No API Route Tests
- **What's not tested:** All CRUD operations for projects, chapters, characters, worldbuilding.
- **Files:** `app/api/projects/`, `app/api/chapters/`, `app/api/characters/`, `app/api/worldbuilding/`
- **Risk:** Auth bypasses, data leaks, and corruption could go unnoticed.

### No Hook Tests
- **What's not tested:** `useChapterEditor`, `useAiTools` hooks.
- **Files:** `hooks/use-chapter-editor.ts`, `hooks/use-ai-tools.ts`
- **Risk:** State management bugs, race conditions, and abort logic failures.

### No Store Tests
- **What's not tested:** Zustand store `useEditorStore`.
- **Files:** `stores/editor-store.ts`
- **Risk:** Store state corruption across editor instances.

### No Component Tests
- **What's not tested:** All UI components (writing-cockpit, side-panel, top-bar, character-card-form, etc.).
- **Risk:** UI rendering bugs, prop mismatches, and event handler failures.

### No Integration Tests
- **What's not tested:** End-to-end flows like create project -> create chapter -> write -> AI rewrite.
- **Risk:** Integration bugs between components, hooks, and API routes.

## Dependencies at Risk

### Next.js 14.2.5
- **Risk:** Minor version, but not latest 14.x (14.2.x has some issues).
- **Impact:** Missing security patches and performance improvements from later versions.
- **Migration plan:** Update to latest 14.x stable after regression testing.

### Zustand 5.0.0
- **Risk:** Major version with potential API changes.
- **Impact:** If store patterns changed, updates needed.
- **Migration plan:** Verify v5 compatibility with current store usage.

### Radix UI Components
- **Risk:** Using shimmed versions in `.ignored` and `.pnpm` directories.
- **Impact:** Updates to `@radix-ui/*` packages may cause import conflicts.
- **Migration plan:** Clean up ignored packages, use pnpm-wrapped versions consistently.

### Supabase SSR 0.5.1
- **Risk:** Older version of SSR package.
- **Impact:** Cookie handling and server client creation may have bugs fixed in later versions.
- **Migration plan:** Check for known issues in changelog before upgrading.

## Missing Critical Features

### Loading States on Chapter Page
- **Problem:** Initial chapter load shows editor immediately, then content appears.
- **Files:** `app/(app)/[projectId]/[chapterId]/page.tsx`
- **Blocks:** Good UX - user sees empty editor briefly before content loads.

### Empty State for Characters Tab in WritingCockpit
- **Problem:** Characters tab always shows "本章未检测到角色" regardless of actual context.
- **Files:** `components/writing-cockpit.tsx` (line 192)
- **Blocks:** Users cannot see which characters were matched in context assembly.

### No Project Description/Style Guide UI
- **Problem:** `style_guide` field exists in database but no UI to edit it.
- **Files:** `types/database.ts` (projects table), `app/(app)/[projectId]/page.tsx`
- **Blocks:** Users cannot set writing style guidance for AI features.

### No Chapter Reordering
- **Problem:** Chapters have `sort_order` but no UI to drag/drop reorder.
- **Files:** `types/database.ts`, `app/(app)/[projectId]/page.tsx`
- **Blocks:** Users must manually edit database to reorder chapters.

---

*Concerns audit: 2026-04-03*
