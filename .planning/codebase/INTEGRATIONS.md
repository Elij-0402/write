# External Integrations

**Analysis Date:** 2026-04-03

## APIs & External Services

**AI/LLM:**
- DeepSeek Chat API - AI-powered writing assistance
  - SDK/Client: Custom implementation in `lib/ai/deepseek.ts`
  - Auth: `DEEPSEEK_API_KEY` environment variable
  - Endpoints: `https://api.deepseek.com/chat/completions`
  - Usage: Writing, rewriting, brainstorming, consistency checking
  - Implementation: `app/api/ai/write/route.ts`, `app/api/ai/rewrite/route.ts`, `app/api/ai/brainstorm/route.ts`, `app/api/ai/consistency-check/route.ts`

## Data Storage

**Database:**
- Supabase (PostgreSQL)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` via `@supabase/ssr`
  - Server client: `lib/supabase/server.ts`
  - Browser client: `lib/supabase/client.ts`
  - Auth: Cookie-based session via SSR middleware

**File Storage:**
- Not detected (no file upload functionality visible)

**Caching:**
- None detected (no Redis, Memcached, or similar)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: `@supabase/ssr` with cookie-based sessions
  - Middleware: `middleware.ts` - handles route protection
  - Protected routes: All except `/login` and `/register`
  - Auth routes defined: `['/login', '/register']`
  - User session retrieval: `supabase.auth.getUser()`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, LogRocket, etc.)

**Logs:**
- Console logging only
  - Example: `console.error('AI write error:', err)` in `app/api/ai/write/route.ts`

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured (no Vercel, Netlify, or Railway configs detected)

**CI Pipeline:**
- Not detected (no GitHub Actions, CircleCI, or similar configs)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous (public) key
- `DEEPSEEK_API_KEY` - DeepSeek API authentication key

**Secrets location:**
- `.env` file in project root (not committed to git based on `.gitignore`)

## Webhooks & Callbacks

**Incoming:**
- None detected (no webhook endpoints)

**Outgoing:**
- DeepSeek API - POST requests to `https://api.deepseek.com/chat/completions`

## Architecture Pattern for External Calls

**AI Integration:**
```
Client (React) → API Route (Next.js) → DeepSeek API
                     ↓
              Supabase (context data)
```

**Database Integration:**
```
Client/Server → Supabase SSR Client → Supabase (PostgreSQL + Auth)
```

**Auth Flow:**
```
Request → Middleware → Supabase SSR → Cookie Session
```

---

*Integration audit: 2026-04-03*
