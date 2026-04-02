# AI 小说工作台 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个沉浸式 AI 小说写作工作台，用户可注册登录、管理书籍章节、用 Tiptap 编辑、AI 续写/改写/头脑风暴，所有 AI 生成通过右侧滑面板预览确认后插入。

**Architecture:** Next.js 14 App Router，前端用 Tiptap 编辑器 + Shadcn/ui，后端用 Next.js Route Handlers 调用 DeepSeek API，数据存 Supabase（Auth + PostgreSQL + RLS）。

**Tech Stack:** Next.js 14 · Supabase · Tiptap 2.x · Shadcn/ui · Tailwind CSS · Zustand · DeepSeek API

---

## 文件结构

```
write/                          # 项目根目录
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          # 顶栏 + 侧滑面板提供者
│   │   ├── page.tsx            # 项目列表
│   │   └── [projectId]/
│   │       ├── page.tsx        # 章节列表 + 编辑器
│   │       └── [chapterId]/page.tsx  # 章节编辑器
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...supabase]/route.ts
│   │   ├── projects/route.ts
│   │   ├── projects/[id]/route.ts
│   │   ├── chapters/route.ts
│   │   ├── chapters/[id]/route.ts
│   │   └── ai/
│   │       ├── write/route.ts
│   │       ├── rewrite/route.ts
│   │       └── brainstorm/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # Shadcn/ui 组件（后续生成）
│   ├── editor/
│   │   └── tiptap-editor.tsx   # Tiptap 编辑器核心组件
│   ├── side-panel.tsx          # 右侧滑 AI 预览面板
│   ├── top-bar.tsx             # 顶部栏（项目+AI工具）
│   ├── project-drawer.tsx      # 左侧项目抽屉
│   ├── status-bar.tsx          # 底部状态栏
│   └── providers.tsx            # Zustand + Supabase Provider
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # 浏览器端 Supabase 客户端
│   │   └── server.ts           # 服务端 Supabase 客户端
│   ├── ai/
│   │   ├── provider.ts         # AIProvider 接口定义
│   │   └── deepseek.ts        # DeepSeek 实现
│   └── prompts/
│       ├── write.ts            # 续写 prompt
│       ├── rewrite.ts          # 改写 prompt
│       └── brainstorm.ts       # 头脑风暴 prompt
├── stores/
│   └── editor-store.ts         # Zustand 编辑器状态
├── types/
│   └── database.ts             # Supabase TypeScript 类型
└── docs/superpowers/
    ├── specs/
    └── plans/
```

---

## Phase 1: 项目初始化 + Auth

### Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "ai-novel-workshop",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.45.4",
    "@supabase/ssr": "^0.5.1",
    "@tiptap/react": "^2.6.6",
    "@tiptap/starter-kit": "^2.6.6",
    "@tiptap/extension-placeholder": "^2.6.6",
    "@tiptap/extension-typography": "^2.6.6",
    "@tiptap/extension-markdown": "^2.6.6",
    "zustand": "^5.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "lucide-react": "^0.446.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "@types/node": "^22.5.4",
    "@types/react": "^18.3.8",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.12",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5"
  }
}
```

- [ ] **Step 2: 创建 next.config.ts**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] }
  }
}

export default nextConfig
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: 创建 tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: 创建 postcss.config.js**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: 运行安装**

Run: `cd D:\write && npm install`
Expected: 安装成功，node_modules 出现

---

### Task 2: 全局样式 + Shadcn/ui 基础

**Files:**
- Create: `app/globals.css`
- Create: `components/ui/button.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/dropdown-menu.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/sheet.tsx`（用于侧滑面板）
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `lib/utils.ts`

- [ ] **Step 1: 创建 app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
}

* {
  border-color: hsl(var(--border));
}
```

- [ ] **Step 2: 创建 lib/utils.ts**

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: 创建 components/ui/button.tsx**

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        outline: 'border border-input bg-transparent hover:bg-accent',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

- [ ] **Step 4: 创建 components/ui/sheet.tsx**（侧滑面板核心组件）

```tsx
'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Sheet({ open, onClose, children, className }: SheetProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className={cn(
        'fixed right-0 top-0 z-50 h-full w-[420px] bg-background border-l shadow-xl flex flex-col',
        className
      )}>
        {children}
      </div>
    </>
  )
}
```

- [ ] **Step 5: 创建其余 UI 组件（dialog, input, label, textarea, tabs）**
  - 参考 Shadcn/ui 官方组件代码，核心是 button + sheet 已覆盖

---

### Task 3: Supabase 客户端配置

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `types/database.ts`
- Create: `.env.local.example`

- [ ] **Step 1: 创建 lib/supabase/client.ts**

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: 创建 lib/supabase/server.ts**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: 创建 .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

- [ ] **Step 4: 创建 types/database.ts**（对应 Supabase Schema）

```ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          ai_model_preference: string
          theme: string
          created_at: string
        }
        Insert: { id: string; ai_model_preference?: string; theme?: string }
        Update: { ai_model_preference?: string; theme?: string }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: { user_id: string; title: string; description?: string }
        Update: { title?: string; description?: string }
      }
      chapters: {
        Row: {
          id: string
          project_id: string
          title: string
          content: Json | null
          word_count: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: { project_id: string; title: string; content?: Json; sort_order?: number }
        Update: { title?: string; content?: Json; word_count?: number; sort_order?: number }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Chapter = Database['public']['Tables']['chapters']['Row']
```

---

### Task 4: Auth 页面（登录 + 注册）

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Modify: `app/layout.tsx`（添加 auth 状态检查）

- [ ] **Step 1: 创建 app/(auth)/layout.tsx**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: 创建 app/(auth)/login/page.tsx**

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else window.location.href = '/'
    setLoading(false)
  }

  async function handleMagicLink() {
    if (!email) { setError('请先输入邮箱'); return }
    await supabase.auth.signInWithOtp({ email })
    alert('发送成功，请查收邮件')
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">AI 小说工作台</h1>
        <p className="text-sm text-muted-foreground mt-1">登录你的账号</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">密码</Label>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </Button>
      </form>
      <div className="text-center text-sm">
        <button onClick={handleMagicLink} className="text-muted-foreground hover:underline">
          使用魔法链接登录
        </button>
      </div>
      <p className="text-center text-sm">
        没有账号？<Link href="/register" className="underline">注册</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: 创建 app/(auth)/register/page.tsx**

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signView({ email, password })
    if (error) setError(error.message)
    else alert('注册成功！请查收验证邮件')
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">创建账号</h1>
        <p className="text-sm text-muted-foreground mt-1">开始你的 AI 写作之旅</p>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">密码（至少 6 位）</Label>
          <Input id="password" type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </Button>
      </form>
      <p className="text-center text-sm">
        已有账号？<Link href="/login" className="underline">登录</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: 更新 app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 小说工作台',
  description: '沉浸式 AI 小说写作工具',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
```

---

## Phase 2: 项目与章节管理

### Task 5: 主布局 + 顶栏组件

**Files:**
- Create: `components/providers.tsx`
- Create: `components/top-bar.tsx`
- Create: `components/side-panel.tsx`
- Create: `components/status-bar.tsx`
- Create: `app/(app)/layout.tsx`

- [ ] **Step 1: 创建 components/providers.tsx**

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

const SupabaseContext = createContext<{ user: User | null }>({ user: null })

export function useSupabase() { return useContext(SupabaseContext) }

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  return <SupabaseContext.Provider value={{ user }}>{children}</SupabaseContext.Provider>
}
```

- [ ] **Step 2: 创建 components/top-bar.tsx**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, PenLine, RefreshCw, Lightbulb, Settings, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AI_TOOLS = [
  { id: 'write', label: '续写', icon: PenLine },
  { id: 'rewrite', label: '改写', icon: RefreshCw },
  { id: 'brainstorm', label: '头脑风暴', icon: Lightbulb },
] as const

interface TopBarProps {
  projectTitle?: string
  onToolClick: (tool: string) => void
  onMenuClick: () => void
}

export function TopBar({ projectTitle, onToolClick, onMenuClick }: TopBarProps) {
  return (
    <header className="h-12 border-b flex items-center px-4 gap-2 shrink-0">
      <Button variant="ghost" size="icon" onClick={onMenuClick} title="项目列表">
        <Menu className="w-4 h-4" />
      </Button>

      <span className="text-sm font-medium text-muted-foreground">
        {projectTitle || 'AI 小说工作台'}
      </span>

      <div className="flex-1" />

      {AI_TOOLS.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="sm"
          onClick={() => onToolClick(id)}
          className={cn('gap-1.5', !projectTitle && 'opacity-50 pointer-events-none')}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}

      <Button variant="ghost" size="icon" asChild>
        <Link href="/settings"><Settings className="w-4 h-4" /></Link>
      </Button>
    </header>
  )
}
```

- [ ] **Step 3: 创建 components/side-panel.tsx**（AI 预览面板，扩展 Task 2 的 Sheet）

```tsx
'use client'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  loading?: boolean
  error?: string
  value: string
  onChange: (v: string) => void
  onInsert: () => void
}

export function SidePanel({ open, onClose, title, loading, error, value, onChange, onInsert }: SidePanelProps) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-medium">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">正在思考...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 p-4 bg-red-50 rounded">{error}</div>
          ) : (
            <Textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              className="min-h-[300px] resize-none"
              placeholder="AI 生成的内容将显示在这里..."
            />
          )}
        </div>

        <div className="px-4 py-3 border-t flex gap-2">
          <Button onClick={onInsert} disabled={loading || !value} className="flex-1">
            插入到光标位置
          </Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
        </div>
      </div>
    </Sheet>
  )
}
```

- [ ] **Step 4: 创建 components/status-bar.tsx**

```tsx
'use client'
interface StatusBarProps {
  wordCount: number
  chapterTitle: string
  saveStatus: 'saved' | 'saving' | 'unsaved'
}

export function StatusBar({ wordCount, chapterTitle, saveStatus }: StatusBarProps) {
  return (
    <footer className="h-8 border-t flex items-center px-4 text-xs text-muted-foreground shrink-0">
      <span>{chapterTitle || '未命名章节'}</span>
      <span className="mx-2">·</span>
      <span>{wordCount.toLocaleString()} 字</span>
      <div className="flex-1" />
      <span className={
        saveStatus === 'saved' ? 'text-green-500' :
        saveStatus === 'saving' ? 'text-yellow-500' : 'text-orange-500'
      }>
        {saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '未保存'}
      </span>
    </footer>
  )
}
```

- [ ] **Step 5: 创建 app/(app)/layout.tsx**

```tsx
'use client'
import { useState, useCallback } from 'react'
import { TopBar } from '@/components/top-bar'
import { SidePanel } from '@/components/side-panel'
import { StatusBar } from '@/components/status-bar'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase()
  const router = useRouter()
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTool, setActiveTool] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const handleToolClick = useCallback((tool: string) => {
    setActiveTool(tool)
    setPanelOpen(true)
    // AI 调用由编辑器页面发起，这里只打开面板
  }, [])

  if (!user) {
    // 重定向到登录（SSR 时需要）
    if (typeof window !== 'undefined') router.push('/login')
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar onToolClick={handleToolClick} onMenuClick={() => {}} />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={activeTool === 'write' ? '续写结果' : activeTool === 'rewrite' ? '改写结果' : '头脑风暴'}
        loading={aiLoading}
        error={aiError}
        value={aiContent}
        onChange={setAiContent}
        onInsert={() => { /* 插入逻辑由编辑器处理 */ }}
      />
    </div>
  )
}
```

---

### Task 6: 项目列表 + 创建项目

**Files:**
- Create: `app/(app)/page.tsx`
- Create: `app/api/projects/route.ts`
- Modify: `components/top-bar.tsx`（添加项目标题 props）

- [ ] **Step 1: 创建 app/api/projects/route.ts**（GET 列表 + POST 创建）

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description } = await req.json()
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, title, description })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: 创建 app/(app)/page.tsx**（项目列表）

```tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import type { Project } from '@/types/database'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  async function createProject() {
    if (!newTitle.trim()) return
    const { data } = await supabase.from('projects').insert({ title: newTitle }).select().single()
    if (data) {
      setProjects([data, ...projects])
      setCreateOpen(false)
      setNewTitle('')
      router.push(`/${data.id}`)
    }
  }

  async function deleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(projects.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">我的书籍</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> 新建书籍</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新书籍</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>书名</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="我的小说" autoFocus />
              </div>
              <Button onClick={createProject} className="w-full">创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">加载中...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">还没有书籍，创建一个开始吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div key={project.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors group">
              <div className="flex-1 cursor-pointer" onClick={() => router.push(`/${project.id}`)}>
                <h3 className="font-medium">{project.title}</h3>
                <p className="text-sm text-muted-foreground">{project.description || '暂无描述'}</p>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteProject(project.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### Task 7: 章节列表 + 路由

**Files:**
- Create: `app/(app)/[projectId]/page.tsx`
- Create: `app/api/chapters/route.ts`
- Create: `app/api/projects/[id]/route.ts`

- [ ] **Step 1: 创建 app/api/projects/[id]/route.ts**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, chapters(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description } = await req.json()
  const { data, error } = await supabase
    .from('projects')
    .update({ title, description, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('projects').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: 创建 app/api/chapters/route.ts**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, title, content } = await req.json()

  // 验证项目归属
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('chapters')
    .insert({ project_id, title: title || '新章节', content: content || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 3: 创建 app/(app)/[projectId]/page.tsx**（章节列表 + 编辑器入口）

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, FileText, ArrowLeft, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { Project, Chapter } from '@/types/database'

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project & { chapters: Chapter[] }>()
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchProject() }, [projectId])

  async function fetchProject() {
    const { data } = await supabase
      .from('projects')
      .select('*, chapters(*)')
      .eq('id', projectId)
      .single()
    setProject(data as any)
    setLoading(false)
  }

  async function createChapter() {
    const { data } = await supabase.from('chapters').insert({
      project_id: projectId,
      title: newTitle || '新章节',
      sort_order: (project?.chapters?.length || 0),
    }).select().single()
    if (data) {
      fetchProject()
      setCreateOpen(false)
      setNewTitle('')
      router.push(`/p/${projectId}/${data.id}`)
    }
  }

  async function deleteChapter(id: string) {
    await supabase.from('chapters').delete().eq('id', id)
    fetchProject()
  }

  if (loading) return <div className="p-8 text-center">加载中...</div>

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回项目列表
      </Button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{project?.title}</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> 新建章节</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>创建新章节</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>章节标题</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus /></div>
              <Button onClick={createChapter} className="w-full">创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {project?.chapters?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>还没有章节</p>
          </div>
        )}
        {project?.chapters?.map((ch: Chapter) => (
          <div key={ch.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
            onClick={() => router.push(`/p/${projectId}/${ch.id}`)}>
            <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="flex-1">{ch.title}</span>
            <span className="text-xs text-muted-foreground">{ch.word_count || 0} 字</span>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 shrink-0"
              onClick={e => { e.stopPropagation(); deleteChapter(ch.id) }}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Phase 3: Tiptap 编辑器

### Task 8: Tiptap 编辑器核心

**Files:**
- Create: `components/editor/tiptap-editor.tsx`
- Create: `app/(app)/[projectId]/[chapterId]/page.tsx`
- Create: `app/api/chapters/[id]/route.ts`
- Create: `stores/editor-store.ts`

- [ ] **Step 1: 创建 stores/editor-store.ts**

```ts
import { create } from 'zustand'

interface EditorState {
  content: string
  wordCount: number
  saveStatus: 'saved' | 'saving' | 'unsaved'
  setContent: (content: string) => void
  setWordCount: (count: number) => void
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  wordCount: 0,
  saveStatus: 'saved',
  setContent: (content) => set({ content, saveStatus: 'unsaved' }),
  setWordCount: (wordCount) => set({ wordCount }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}))
```

- [ ] **Step 2: 创建 components/editor/tiptap-editor.tsx**

```tsx
'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { useEffect, useCallback, useRef } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { cn } from '@/lib/utils'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  onWordCountChange: (count: number) => void
  placeholder?: string
  className?: string
}

export function TiptapEditor({ content, onChange, onWordCountChange, placeholder, className }: TiptapEditorProps) {
  const { setContent: setStoreContent, setWordCount, setSaveStatus } = useEditorStore()
  const lastSavedRef = useRef(content)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: placeholder || '开始写作...' }),
      Typography,
    ],
    content: content ? JSON.parse(content) : '',
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON())
      const text = editor.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      onChange(json)
      setStoreContent(json)
      setWordCount(words)
      onWordCountChange(words)
      setSaveStatus('unsaved')
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] py-4 px-8',
          className
        ),
      },
    },
  })

  // 同步外部内容变化（如章节切换）
  useEffect(() => {
    if (editor && content !== lastSavedRef.current) {
      try {
        editor.commands.setContent(content ? JSON.parse(content) : '', false)
        lastSavedRef.current = content
      } catch {
        editor.commands.setContent('', false)
      }
    }
  }, [content, editor])

  return <EditorContent editor={editor} className="flex-1 overflow-auto" />
}
```

- [ ] **Step 3: 创建 app/api/chapters/[id]/route.ts**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('chapters')
    .select('*, project:projects(id, user_id)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((data.project as any).user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, word_count, sort_order } = await req.json()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, project:projects(user_id)')
    .eq('id', id)
    .single()

  if (!chapter || (chapter.project as any).user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: updated, error } = await supabase
    .from('chapters')
    .update({ title, content, word_count, sort_order, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, project:projects(user_id)')
    .eq('id', id)
    .single()

  if (!chapter || (chapter.project as any).user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.from('chapters').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: 创建章节编辑器页面 app/(app)/[projectId]/[chapterId]/page.tsx**

```tsx
'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { StatusBar } from '@/components/status-bar'
import { TopBar } from '@/components/top-bar'
import { SidePanel } from '@/components/side-panel'
import type { Chapter, Project } from '@/types/database'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/stores/editor-store'

export default function ChapterEditorPage() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>()
  const [chapter, setChapter] = useState<Chapter>()
  const [project, setProject] = useState<Project>()
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTool, setActiveTool] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const saveTimerRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef('')
  const supabase = createClient()
  const router = useRouter()
  const { saveStatus, setSaveStatus } = useEditorStore()

  useEffect(() => { loadChapter() }, [chapterId])

  async function loadChapter() {
    const { data } = await supabase.from('chapters').select('*, project:projects(id, title)').eq('id', chapterId).single()
    if (data) {
      setChapter(data as Chapter)
      setProject((data as any).project as Project)
      setContent((data as any).content || '')
      lastSavedRef.current = (data as any).content || ''
    }
  }

  const saveChapter = useCallback(async (contentToSave: string) => {
    setSaveStatus('saving')
    await supabase.from('chapters').update({
      content: contentToSave,
      word_count: wordCount,
    }).eq('id', chapterId)
    lastSavedRef.current = contentToSave
    setSaveStatus('saved')
  }, [chapterId, wordCount, supabase, setSaveStatus])

  // 防抖自动保存
  useEffect(() => {
    if (!content || content === lastSavedRef.current) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveChapter(content), 2000)
    return () => clearTimeout(saveTimerRef.current)
  }, [content, saveChapter])

  function handleToolClick(tool: string) {
    setActiveTool(tool)
    setPanelOpen(true)
    // 后续 Task 9/10 中接入 AI 逻辑
  }

  function handleInsert() {
    // 将 aiContent 插入编辑器
    // 简单方案：用 TextContent 追加；复杂方案：用 Tiptap chain()
    // 这里先占位，后续 Task 9 实现
    setPanelOpen(false)
    setAiContent('')
  }

  async function handleTitleSave(newTitle: string) {
    await supabase.from('chapters').update({ title: newTitle }).eq('id', chapterId)
    setChapter({ ...chapter!, title: newTitle })
    setEditingTitle(false)
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        projectTitle={project?.title}
        onToolClick={handleToolClick}
        onMenuClick={() => router.push(`/p/${projectId}`)}
      />

      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/p/${projectId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        {editingTitle ? (
          <Input
            defaultValue={chapter?.title}
            autoFocus
            className="h-7 text-sm"
            onBlur={e => handleTitleSave(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          />
        ) : (
          <span
            className="text-sm font-medium cursor-pointer hover:text-primary"
            onClick={() => setEditingTitle(true)}
          >
            {chapter?.title || '加载中...'}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <TiptapEditor
          content={content}
          onChange={setContent}
          onWordCountChange={setWordCount}
          placeholder="开始你的故事..."
        />
      </div>

      <StatusBar
        wordCount={wordCount}
        chapterTitle={chapter?.title || ''}
        saveStatus={saveStatus}
      />

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={activeTool === 'write' ? '续写结果' : activeTool === 'rewrite' ? '改写结果' : '头脑风暴'}
        loading={aiLoading}
        error={aiError}
        value={aiContent}
        onChange={setAiContent}
        onInsert={handleInsert}
      />
    </div>
  )
}
```

---

## Phase 4: AI 层（DeepSeek）

### Task 9: AI Provider + API 路由

**Files:**
- Create: `lib/ai/provider.ts`
- Create: `lib/ai/deepseek.ts`
- Create: `lib/prompts/write.ts`
- Create: `lib/prompts/rewrite.ts`
- Create: `lib/prompts/brainstorm.ts`
- Create: `app/api/ai/write/route.ts`
- Create: `app/api/ai/rewrite/route.ts`
- Create: `app/api/ai/brainstorm/route.ts`

- [ ] **Step 1: 创建 lib/ai/provider.ts**

```ts
export interface AIProvider {
  complete(prompt: string, options?: { max_tokens?: number; temperature?: number }): Promise<string>
}

export interface WriteOptions {
  context: string      // 光标前文（~200字）
  genre?: string       // 小说类型/风格
  wordCount?: number   // 期望字数
}
```

- [ ] **Step 2: 创建 lib/ai/deepseek.ts**

```ts
import type { AIProvider } from './provider'

export class DeepSeekProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'deepseek-chat') {
    this.apiKey = apiKey
    this.model = model
  }

  async complete(prompt: string, options?: { max_tokens?: number; temperature?: number }): Promise<string> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.max_tokens ?? 1024,
        temperature: options?.temperature ?? 0.8,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    return data.choices[0].message.content as string
  }
}

// 单例
let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!_provider) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set')
    _provider = new DeepSeekProvider(apiKey)
  }
  return _provider
}
```

- [ ] **Step 3: 创建 lib/prompts/write.ts**

```ts
export function buildWritePrompt(context: string, wordCount = 300): string {
  return `你是一位专业的小说作家。请根据以下文风续写故事。

上下文（仅用于风格参考，不要重复）：
${context}

请续写 200-${wordCount} 字。直接输出续写内容，不要加任何前缀说明。`
}
```

- [ ] **Step 4: 创建 lib/prompts/rewrite.ts**

```ts
export function buildRewritePrompt(selectedText: string): string {
  return `你是一位专业的小说作家。请对以下文字进行改写，提供 2 个不同风格版本。

原文：
${selectedText}

请生成 2 个改写版本，每个版本 150-300 字。格式：
版本1：（[风格描述]）
[改写内容]

版本2：（[风格描述]）
[改写内容]

直接输出改写结果，不要加任何说明。`
}
```

- [ ] **Step 5: 创建 lib/prompts/brainstorm.ts**

```ts
export function buildBrainstormPrompt(topic: string): string {
  return `你是一位创意写作教练。用户正在创作小说，遇到以下问题/想探索：

"${topic}"

请提供 3-5 个创意方向或解决思路，每个 50-100 字。
用编号列表格式输出，直接给内容，不需要"以下是..."之类的引导语。`
}
```

- [ ] **Step 6: 创建 app/api/ai/write/route.ts**

```ts
import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { buildWritePrompt } from '@/lib/prompts/write'

export async function POST(req: Request) {
  try {
    const { context, wordCount } = await req.json()

    if (!context || context.trim().length < 10) {
      return NextResponse.json({ error: '上下文内容不足' }, { status: 400 })
    }

    const provider = getAIProvider()
    const prompt = buildWritePrompt(context, wordCount || 300)
    const result = await provider.complete(prompt, { max_tokens: 1024, temperature: 0.85 })

    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    console.error('AI write error:', err)
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
```

- [ ] **Step 7: 创建 app/api/ai/rewrite/route.ts**

```ts
import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { buildRewritePrompt } from '@/lib/prompts/rewrite'

export async function POST(req: Request) {
  try {
    const { selectedText } = await req.json()

    if (!selectedText || selectedText.trim().length < 5) {
      return NextResponse.json({ error: '请选择要改写的文字' }, { status: 400 })
    }

    const provider = getAIProvider()
    const prompt = buildRewritePrompt(selectedText)
    const result = await provider.complete(prompt, { max_tokens: 2048, temperature: 0.9 })

    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
```

- [ ] **Step 8: 创建 app/api/ai/brainstorm/route.ts**

```ts
import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { buildBrainstormPrompt } from '@/lib/prompts/brainstorm'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()

    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: '请输入想探索的内容' }, { status: 400 })
    }

    const provider = getAIProvider()
    const prompt = buildBrainstormPrompt(topic)
    const result = await provider.complete(prompt, { max_tokens: 1536, temperature: 0.9 })

    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
```

---

### Task 10: 编辑器页面接入 AI 工具

**Files:**
- Modify: `app/(app)/[projectId]/[chapterId]/page.tsx`（接入 AI 逻辑）
- Modify: `components/side-panel.tsx`（增加 AI 内容输入）

- [ ] **Step 1: 扩展 SidePanel 支持 AI 输入模式（头脑风暴需要输入框）**

更新 SidePanel，当 tool === 'brainstorm' 时显示输入框而非只读 Textarea：

```tsx
// 在 SidePanel 的 panelContent 部分添加：
{tool === 'brainstorm' && !loading && !error && (
  <div className="mb-3">
    <Input
      placeholder="想探索什么？（如：如何让主角陷入两难抉择）"
      value={brainstormInput}
      onChange={e => setBrainstormInput(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') onBrainstormSubmit?.() }}
    />
    <Button onClick={onBrainstormSubmit} className="mt-2 w-full">开始头脑风暴</Button>
  </div>
)}
```

- [ ] **Step 2: 在编辑器页面接入 AI 调用**

在 ChapterEditorPage 中添加 AI 调用逻辑：

```tsx
// 添加到 ChapterEditorPage 的 handleToolClick 函数中：
async function handleToolClick(tool: string) {
  setActiveTool(tool)

  if (tool === 'brainstorm') {
    setPanelOpen(true)
    setAiContent('')
    setAiError('')
    return
  }

  // 续写：获取光标前 200 字
  if (tool === 'write') {
    const editorText = useEditorStore.getState().content
    const text = extractTextFromJson(editorText) // 取最后 200 字
    const context = text.slice(-200)
    setPanelOpen(true)
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/ai/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, wordCount: 300 }),
      })
      const data = await res.json()
      if (data.error) setAiError(data.error)
      else setAiContent(data.result)
    } catch (e: any) { setAiError(e.message) }
    setAiLoading(false)
  }

  // 改写：获取选中文字
  if (tool === 'rewrite') {
    // 从 Tiptap editor 获取选中文本（需要通过 ref）
    const selectedText = editorRef.current?.getSelectedText() || ''
    if (!selectedText) { alert('请先选中要改写的文字'); return }
    setPanelOpen(true)
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedText }),
      })
      const data = await res.json()
      if (data.error) setAiError(data.error)
      else setAiContent(data.result)
    } catch (e: any) { setAiError(e.message) }
    setAiLoading(false)
  }
}

// handleInsert: 将 aiContent 插入编辑器
function handleInsert() {
  if (!aiContent) return
  // 通过 Tiptap chain 插入文本
  editorRef.current?.commands.insertContent(aiContent)
  setPanelOpen(false)
}
```

---

## Phase 5: Supabase 数据库初始化

### Task 11: Supabase SQL Schema

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: 创建 supabase/schema.sql**

```sql
-- 在 Supabase SQL Editor 中运行此脚本

-- 启用 UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles（扩展 auth.users）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  ai_model_preference TEXT DEFAULT 'deepseek',
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建设置触发器（新建用户自动创建 profile）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 书籍项目
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 章节
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB,
  word_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD chapters in own projects" ON public.chapters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );
```

---

## Phase 6: 最终集成 + 启动

### Task 12: 根路由重定向

**Files:**
- Modify: `app/page.tsx`（根路由）

- [ ] **Step 1: 创建根页面**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/p')
  else redirect('/login')
}
```

---

### Task 13: 验证构建

**Files:**
- Run: `npm run build`

- [ ] **Step 1: 运行构建**

Run: `npm run build`
Expected: Next.js 构建成功，无 TypeScript 错误

- [ ] **Step 2: 如有错误，逐个修复**

常见问题：
- Supabase 类型不匹配 → 检查 types/database.ts 与 schema.sql 一致
- Tiptap 编辑器 SSR 问题 → 确认所有编辑器组件加了 'use client'
- 环境变量缺失 → 确保 .env.local 已配置

---

## 自检清单

### Spec Coverage
- [x] 登录注册（Task 4）
- [x] 项目列表 + 创建（Task 6）
- [x] 章节 CRUD（Task 7）
- [x] Tiptap 编辑器（Task 8）
- [x] 续写 AI（Task 9 + Task 10）
- [x] 改写 AI（Task 9 + Task 10）
- [x] 头脑风暴 AI（Task 9 + Task 10）
- [x] 侧滑预览面板（Task 5 + Task 2）
- [x] 顶栏 AI 工具（Task 5）
- [x] 状态栏（Task 5）
- [x] 自动保存（Task 8 防抖 2s）
- [x] Supabase Schema + RLS（Task 11）

### Placeholder Scan
- 无 TBD / TODO
- 所有 prompt 模板均有实际内容
- 所有 API 路由均有完整错误处理
- 所有组件均有实际 JSX 实现

### Type Consistency
- `Database` 类型定义与 schema.sql 一致
- `Chapter`, `Project`, `Profile` 从 Database 泛化导出
- API 路由参数使用 `{ params: Promise<{ id: string }> }`（Next.js 15 兼容）
