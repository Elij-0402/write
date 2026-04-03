# Codebase Structure

**Analysis Date:** 2026-04-03

## Directory Layout

```
/d/write/
├── app/                    # Next.js App Router
│   ├── (app)/              # Protected app routes (require auth)
│   ├── (auth)/             # Auth routes (login, register)
│   ├── api/                # API route handlers
│   │   ├── ai/             # AI endpoints (write, rewrite, brainstorm, consistency-check)
│   │   ├── chapters/       # Chapter CRUD
│   │   ├── characters/     # Character CRUD
│   │   ├── projects/       # Project CRUD
│   │   └── worldbuilding/  # Worldbuilding CRUD
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles + Tailwind
├── components/             # React components
│   ├── editor/             # Tiptap editor components
│   ├── ui/                 # Radix UI primitive components
│   ├── providers.tsx       # React context providers
│   ├── top-bar.tsx         # App header with tools
│   ├── side-panel.tsx      # AI results panel
│   ├── mobile-menu.tsx     # Mobile navigation
│   └── writing-cockpit.tsx # AI tools UI
├── hooks/                  # Custom React hooks
│   ├── use-ai-tools.ts     # AI tool interactions
│   └── use-chapter-editor.ts # Chapter editing logic
├── lib/                    # Utilities and integrations
│   ├── ai/                 # AI provider and context assembly
│   │   ├── provider.ts     # AIProvider interface
│   │   ├── deepseek.ts     # DeepSeek implementation
│   │   └── context-assembler.ts
│   ├── prompts/            # AI prompt templates
│   ├── supabase/           # Supabase client factories
│   └── utils/              # Utility functions
├── stores/                 # Zustand state stores
├── types/                  # TypeScript type definitions
├── supabase/               # Supabase configuration (migrations, etc.)
├── __tests__/              # Test files
├── middleware.ts           # Next.js middleware (auth)
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router with all routes and layouts
- Contains: Pages, API routes, layouts
- Key files: `layout.tsx`, `globals.css`

**app/(app)/:**
- Purpose: Protected routes requiring authentication
- Contains: Projects list, project detail, chapter editor
- Key files: `page.tsx`, `[projectId]/page.tsx`, `[projectId]/[chapterId]/page.tsx`

**app/(auth)/:**
- Purpose: Authentication routes
- Contains: Login, register pages
- Key files: `login/page.tsx`, `register/page.tsx`

**app/api/:**
- Purpose: Backend API endpoints
- Contains: REST endpoints for all entities and AI tools
- Key files: Route handler files with GET/POST/PUT/DELETE

**components/:**
- Purpose: Reusable React UI components
- Contains: UI primitives, editor components, layout components
- Key files: `writing-cockpit.tsx`, `top-bar.tsx`, `side-panel.tsx`

**components/ui/:**
- Purpose: Radix UI primitive wrappers
- Contains: `button.tsx`, `input.tsx`, `dialog.tsx`, `select.tsx`, etc.

**components/editor/:**
- Purpose: Tiptap rich text editor
- Contains: `tiptap-editor.tsx`

**hooks/:**
- Purpose: Reusable React hook logic
- Contains: `use-ai-tools.ts`, `use-chapter-editor.ts`

**lib/ai/:**
- Purpose: AI text generation
- Contains: Provider interface, DeepSeek implementation, context assembly

**lib/prompts/:**
- Purpose: AI prompt templates for different tasks
- Contains: `write.ts`, `rewrite.ts`, `brainstorm.ts`, `consistency.ts`

**lib/supabase/:**
- Purpose: Supabase client factories
- Contains: `client.ts` (browser), `server.ts` (server)

**lib/utils/:**
- Purpose: Utility functions
- Contains: `utils.ts` (cn helper), `tiptap.ts` (Tiptap utilities)

**stores/:**
- Purpose: Zustand state management
- Contains: `editor-store.ts`

**types/:**
- Purpose: TypeScript type definitions
- Contains: `database.ts` (Supabase types, entity types)

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout, font loading, HTML structure
- `app/(app)/layout.tsx`: Protected app shell (TopBar, MobileMenu, SidePanel)
- `app/(auth)/layout.tsx`: Auth pages layout

**Configuration:**
- `middleware.ts`: Auth middleware
- `tailwind.config.ts`: Tailwind CSS config
- `tsconfig.json`: TypeScript config

**Core Logic:**
- `app/api/ai/write/route.ts`: AI write endpoint
- `lib/ai/context-assembler.ts`: Context gathering for AI prompts
- `hooks/use-chapter-editor.ts`: Chapter loading and auto-save
- `hooks/use-ai-tools.ts`: AI tool interaction logic

**State Management:**
- `stores/editor-store.ts`: Editor state (content, wordCount, saveStatus)
- `components/providers.tsx`: User session context

## Naming Conventions

**Files:**
- PascalCase for React components: `TiptapEditor.tsx`, `TopBar.tsx`
- kebab-case for pages/routes: `login/page.tsx`, `brainstorm/route.ts`
- kebab-case for hooks: `use-ai-tools.ts`
- kebab-case for lib files: `context-assembler.ts`, `deepseek.ts`
- kebab-case for stores: `editor-store.ts`

**Directories:**
- kebab-case: `app/api/ai/`, `components/ui/`, `lib/ai/`

**Types/Interfaces:**
- PascalCase: `AIProvider`, `EditorState`, `ContextPackage`

**Route Groups:**
- parentheses with names: `(app)`, `(auth)`

## Where to Add New Code

**New API Route:**
- Primary: `app/api/{resource}/route.ts` for list/create
- Single item: `app/api/{resource}/[id]/route.ts`
- Example: `app/api/tags/route.ts` for tags CRUD

**New AI Endpoint:**
- Primary: `app/api/ai/{tool}/route.ts`
- Prompt: Add to `lib/prompts/{tool}.ts`
- Implementation: Add provider logic in `lib/ai/`

**New Component:**
- Layout component: `components/top-bar.tsx`
- UI primitive: `components/ui/{component}.tsx`
- Editor tool: `components/editor/{tool}.tsx`

**New Hook:**
- Location: `hooks/use-{name}.ts`
- Follow pattern of existing hooks (useCallback for handlers, useState for local state)

**New Page:**
- Protected: `app/(app)/{page}/page.tsx`
- Auth: `app/(auth)/login/page.tsx`
- Public: `app/{page}/page.tsx`

**New Store:**
- Location: `stores/{name}-store.ts`
- Use Zustand with interface for types

**New Type:**
- Location: `types/database.ts` or new file in `types/`
- Export from central location if adding new file

## Special Directories

**.next/:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (.gitignore)

**node_modules/:**
- Purpose: Dependencies
- Generated: Yes (via pnpm)
- Committed: No

**supabase/:**
- Purpose: Database migrations and config
- Generated: No
- Committed: Yes

**__tests__/:**
- Purpose: Test files (Vitest)
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-03*
