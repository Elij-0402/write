# Technology Stack

**Analysis Date:** 2026-04-03

## Languages

**Primary:**
- TypeScript 5.6.2 - All source code (`.ts`, `.tsx` files)

**Secondary:**
- JavaScript - Minimal, only in config files (`.js` for Next.js config, PostCSS config)

## Runtime

**Environment:**
- Node.js (implied by Next.js, version determined by project setup)
- Browser - Client-side React rendering

**Package Manager:**
- pnpm 10+ (based on `pnpm-lock.yaml` presence)
- Lockfile: `pnpm-lock.yaml`

## Frameworks

**Core:**
- Next.js 14.2.5 - Full-stack React framework with App Router
- React 18.3.1 - UI library

**Styling:**
- Tailwind CSS 3.4.12 - Utility-first CSS framework
- PostCSS 8.4.47 - CSS transformation tool
- Autoprefixer 10.4.20 - Vendor prefix automation

**State Management:**
- Zustand 5.0.0 - Lightweight state management

**Rich Text Editing:**
- Tiptap 2.6.6 - Headless rich text editor
- Tiptap extensions: Starter Kit, Placeholder, Typography

**UI Components:**
- Radix UI (multiple packages):
  - `@radix-ui/react-alert-dialog` 1.1.15
  - `@radix-ui/react-dialog` 1.1.2
  - `@radix-ui/react-dropdown-menu` 2.1.2
  - `@radix-ui/react-label` 2.1.0
  - `@radix-ui/react-select` 2.2.6
  - `@radix-ui/react-tabs` 1.1.1
  - `@radix-ui/react-sheet` - Mobile sheet/drawer

**Utilities:**
- class-variance-authority 0.7.0 - Component variant styling
- clsx 2.1.1 - Conditional class names
- tailwind-merge 2.5.2 - Tailwind CSS merge utility
- lucide-react 0.446.0 - Icon library

**Database & Auth:**
- @supabase/ssr 0.5.1 - Server-side Supabase client
- @supabase/supabase-js 2.45.4 - Supabase client library

## Testing

**Framework:**
- Vitest 4.1.2 - Unit testing framework
- Configuration: `vitest.config.ts`
- Types: `@types/node` 22.5.4, `@types/react` 18.3.8, `@types/react-dom` 18.3.0

## Build & Dev

**Linting:**
- ESLint 8.57.0 - Code linting
- eslint-config-next 14.2.5 - Next.js ESLint configuration

**Compiler:**
- TypeScript 5.6.2 with strict mode enabled
- Target: ES2017
- Path alias: `@/*` maps to project root

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Strict mode enabled
- `skipLibCheck: true`
- Path aliases configured

**Tailwind:**
- Config: `tailwind.config.ts`
- CSS variables for theming (border, input, ring, background, foreground, primary, secondary, etc.)
- Custom colors: surface (warm), success, warning, error, info
- Font families: Noto Serif SC (serif), Noto Sans SC (sans)

**PostCSS:**
- Config: `postcss.config.js`
- Plugins: tailwindcss, autoprefixer

**Next.js:**
- Config: `next.config.js`
- Server Actions enabled (experimental)
- Allowed origins: localhost:3000

**Environment:**
- `.env` file present - contains environment configuration
- Required variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DEEPSEEK_API_KEY`

## Platform Requirements

**Development:**
- Node.js 18+
- pnpm 8+
- Port 3000 for dev server

**Production:**
- Node.js 18+ for SSR
- Supported browsers: Modern browsers (ES2017 target)

---

*Stack analysis: 2026-04-03*
