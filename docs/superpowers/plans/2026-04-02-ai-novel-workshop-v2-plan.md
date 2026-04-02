# AI 小说工作台 v2 — 角色卡 + 设定卡实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement task-by-task.

**Goal:** 添加角色卡和世界观设定卡管理功能，以及 AI 写作时自动注入角色上下文。

**Tech Stack:** 同 v1（Next.js 14 + Supabase + DeepSeek）

---

## 文件结构变更

```
新增文件：
├── app/api/characters/route.ts
├── app/api/characters/[id]/route.ts
├── app/api/worldbuilding/route.ts
├── app/api/worldbuilding/[id]/route.ts
├── app/(app)/[projectId]/
│   ├── characters/page.tsx     # 角色卡管理页
│   └── worldbuilding/page.tsx  # 设定卡管理页
├── components/character-card-form.tsx
├── components/worldbuilding-card-form.tsx

修改文件：
├── components/top-bar.tsx          # 添加「角色」「设定」按钮
├── types/database.ts               # 添加 Character, Worldbuilding 类型
├── supabase/schema.sql            # 添加 characters, worldbuilding 表
├── lib/prompts/write.ts           # 注入角色上下文
└── lib/prompts/rewrite.ts        # 注入角色上下文
```

---

## Task 1: 扩展数据库 Schema

**Files:**
- Modify: `supabase/schema.sql`（追加新表）
- Modify: `types/database.ts`（添加类型）

### Step 1: 追加 schema.sql

```sql
-- 角色卡
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '未命名角色',
  traits JSONB DEFAULT '{"appearance":"","personality":"","background":"","motivation":"","relationships":""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 设定卡
CREATE TABLE IF NOT EXISTS public.worldbuilding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL DEFAULT '新设定',
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worldbuilding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD characters in own projects" ON public.characters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can CRUD worldbuilding in own projects" ON public.worldbuilding
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  );
```

### Step 2: 更新 types/database.ts

在 Database interface 的 tables 中追加：

```ts
characters: {
  Row: {
    id: string
    project_id: string
    name: string
    traits: {
      appearance: string
      personality: string
      background: string
      motivation: string
      relationships: string
    }
    created_at: string
    updated_at: string
  }
  Insert: { project_id: string; name?: string; traits?: CharacterTraits }
  Update: { name?: string; traits?: CharacterTraits }
}

worldbuilding: {
  Row: {
    id: string
    project_id: string
    category: string
    title: string
    content: string
    created_at: string
    updated_at: string
  }
  Insert: { project_id: string; category?: string; title?: string; content?: string }
  Update: { category?: string; title?: string; content?: string }
}
```

---

## Task 2: 角色卡 API 路由

**Files:**
- Create: `app/api/characters/route.ts`
- Create: `app/api/characters/[id]/route.ts`

### app/api/characters/route.ts

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/characters?project_id=xxx — 列出某项目所有角色
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

// POST — 创建角色
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, name, traits } = await req.json()

  const { data: project } = await supabase.from('projects').select('id').eq('id', project_id).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('characters')
    .insert({ project_id, name: name || '未命名角色', traits: traits || {} })
    .select().single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

### app/api/characters/[id]/route.ts

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('characters')
    .select('*, project:projects(user_id)')
    .eq('id', id).single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((data.project as any).user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, traits } = await req.json()
  const { data: ch } = await supabase.from('characters').select('id, project:projects(user_id)').eq('id', id).single()
  if (!ch || (ch.project as any).user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('characters')
    .update({ name, traits, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ch } = await supabase.from('characters').select('id, project:projects(user_id)').eq('id', id).single()
  if (!ch || (ch.project as any).user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.from('characters').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
```

---

## Task 3: 设定卡 API 路由

**Files:**
- Create: `app/api/worldbuilding/route.ts`
- Create: `app/api/worldbuilding/[id]/route.ts`

API 结构和 characters 完全相同，只是表名换成 `worldbuilding`，字段为 `category`, `title`, `content`。

---

## Task 4: TopBar 添加角色/设定按钮

**Files:**
- Modify: `components/top-bar.tsx`

在 AI_TOOLS 数组中添加：

```tsx
import { User, Map } from 'lucide-react'

const PROJECT_TOOLS = [
  { id: 'characters', label: '角色', icon: User },
  { id: 'worldbuilding', label: '设定', icon: Map },
] as const

// 在 AI_TOOLS 之后添加分隔 + PROJECT_TOOLS 按钮
<div className="flex-1" />
{/* 新分隔之前的保持不变 */}

// 项目工具按钮放在 AI 工具左侧
<div className="h-4 w-px bg-border mx-1" />
{PROJECT_TOOLS.map(({ id, label, icon: Icon }) => (
  <Button
    key={id}
    variant="ghost"
    size="sm"
    onClick={() => onProjectToolClick(id)}
    className="gap-1.5"
  >
    <Icon className="w-3.5 h-3.5" />
    <span className="text-xs">{label}</span>
  </Button>
))}
```

新增 props: `onProjectToolClick: (tool: string) => void`

---

## Task 5: 角色卡管理页面

**Files:**
- Create: `app/(app)/[projectId]/characters/page.tsx`
- Create: `components/character-card-form.tsx`

### components/character-card-form.tsx

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CharacterTraits {
  appearance: string
  personality: string
  background: string
  motivation: string
  relationships: string
}

interface Props {
  initialData?: {
    id?: string
    name: string
    traits: CharacterTraits
  }
  onSave: (data: { name: string; traits: CharacterTraits }) => Promise<void>
  onCancel: () => void
}

export function CharacterCardForm({ initialData, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialData?.name || '')
  const [traits, setTraits] = useState<CharacterTraits>(
    initialData?.traits || { appearance: '', personality: '', background: '', motivation: '', relationships: '' }
  )
  const [saving, setSaving] = useState(false)

  function updateTrait(key: keyof CharacterTraits, value: string) {
    setTraits(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, traits })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>角色名称</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="李明" />
      </div>
      <div>
        <Label>外貌</Label>
        <Textarea value={traits.appearance} onChange={e => updateTrait('appearance', e.target.value)} placeholder="身高、体型、五官特征..." rows={2} />
      </div>
      <div>
        <Label>性格</Label>
        <Textarea value={traits.personality} onChange={e => updateTrait('personality', e.target.value)} placeholder="性格特点、行为习惯..." rows={2} />
      </div>
      <div>
        <Label>背景</Label>
        <Textarea value={traits.background} onChange={e => updateTrait('background', e.target.value)} placeholder="成长经历、过去的事件..." rows={2} />
      </div>
      <div>
        <Label>动机</Label>
        <Textarea value={traits.motivation} onChange={e => updateTrait('motivation', e.target.value)} placeholder="这个角色想要什么..." rows={2} />
      </div>
      <div>
        <Label>关系网</Label>
        <Textarea value={traits.relationships} onChange={e => updateTrait('relationships', e.target.value)} placeholder="与其他角色的关系..." rows={2} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
      </div>
    </form>
  )
}
```

### app/(app)/[projectId]/characters/page.tsx

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Trash2, User } from 'lucide-react'
import { CharacterCardForm } from '@/components/character-card-form'

interface Character {
  id: string
  name: string
  traits: any
  created_at: string
}

export default function CharactersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchCharacters() }, [projectId])

  async function fetchCharacters() {
    const { data } = await supabase.from('characters').select('*').eq('project_id', projectId).order('created_at')
    setCharacters(data || [])
    setLoading(false)
  }

  async function handleSave({ name, traits }: { name: string; traits: any }) {
    if (editingId) {
      await supabase.from('characters').update({ name, traits }).eq('id', editingId)
    } else {
      await supabase.from('characters').insert({ project_id: projectId, name, traits })
    }
    fetchCharacters()
    setShowForm(false)
    setEditingId(null)
  }

  async function deleteCharacter(id: string) {
    await supabase.from('characters').delete().eq('id', id)
    setCharacters(characters.filter(c => c.id !== id))
  }

  function startEdit(ch: Character) {
    setEditingId(ch.id)
    setShowForm(true)
  }

  if (showForm) {
    const editing = editingId ? characters.find(c => c.id === editingId) : null
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingId(null) }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">{editingId ? '编辑角色' : '新建角色'}</h1>
        </div>
        <CharacterCardForm
          initialData={editing ? { name: editing.name, traits: editing.traits } : undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null) }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/p/${projectId}`)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回章节
      </Button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">角色卡</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> 新建角色</Button>
      </div>

      {loading ? <div className="text-center py-12 text-muted-foreground">加载中...</div> :
       characters.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">还没有角色，创建第一个角色吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {characters.map(ch => (
            <div key={ch.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => startEdit(ch)}>
                  <h3 className="font-medium">{ch.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ch.traits?.personality?.slice(0, 60) || '暂无性格描述'}
                    {(ch.traits?.personality?.length || 0) > 60 ? '...' : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteCharacter(ch.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Task 6: 设定卡管理页面

**Files:**
- Create: `app/(app)/[projectId]/worldbuilding/page.tsx`

结构与角色卡页面相同，替换 `characters` 为 `worldbuilding`，字段为 `category`, `title`, `content`。category 选项：general / history / geography / culture / magic / technology / other。

---

## Task 7: AI Prompt 注入角色上下文

**Files:**
- Modify: `lib/prompts/write.ts`
- Modify: `lib/prompts/rewrite.ts`

### Step 1: 扩展 write.ts

```ts
export function buildWritePrompt(
  context: string,
  wordCount = 300,
  characterContext?: string  // 新参数
): string {
  let prompt = `你是一位专业的小说作家。请根据以下文风续写故事。`

  if (characterContext) {
    prompt += `\n\n当前场景涉及的角色设定：\n${characterContext}`
  }

  prompt += `\n\n上下文（仅用于风格参考，不要重复）：\n${context}\n\n请续写 200-${wordCount} 字。直接输出续写内容，不要加任何前缀说明。`
  return prompt
}
```

### Step 2: 扩展 rewrite.ts

```ts
export function buildRewritePrompt(
  selectedText: string,
  characterContext?: string
): string {
  let prompt = `你是一位专业的小说作家。请对以下文字进行改写，提供 2 个不同风格版本。`

  if (characterContext) {
    prompt += `\n\n当前场景涉及的角色设定：\n${characterContext}`
  }

  prompt += `\n\n原文：\n${selectedText}\n\n请生成 2 个改写版本，每个版本 150-300 字。格式：\n版本1：（[风格描述]）\n[改写内容]\n\n版本2：（[风格描述]）\n[改写内容]\n\n直接输出改写结果，不要加任何说明。`
  return prompt
}
```

### Step 3: 修改 API 路由支持角色注入

在 `app/api/ai/write/route.ts` 和 `app/api/ai/rewrite/route.ts` 中：
- 接收可选的 `characterId` 参数
- 如果有 characterId，从数据库查询角色的 traits，构建 characterContext 字符串
- 传给 prompt builder

```ts
// 修改 write/route.ts
export async function POST(req: Request) {
  try {
    const { context, wordCount, characterId } = await req.json()
    let characterContext: string | undefined

    if (characterId) {
      const { data: ch } = await supabase
        .from('characters')
        .select('name, traits')
        .eq('id', characterId)
        .single()
      if (ch) {
        characterContext = `【${ch.name}】\n` +
          `外貌：${ch.traits?.appearance || '未设定'}\n` +
          `性格：${ch.traits?.personality || '未设定'}\n` +
          `背景：${ch.traits?.background || '未设定'}\n` +
          `动机：${ch.traits?.motivation || '未设定'}\n` +
          `关系：${ch.traits?.relationships || '未设定'}`
      }
    }

    const prompt = buildWritePrompt(context, wordCount || 300, characterContext)
    // ... rest unchanged
  }
}
```

---

## Task 8: 验证构建

Run: `npm run build`

Expected: 构建成功，无 TypeScript 错误。

---

## 自检清单

### Spec Coverage
- [x] 角色卡 CRUD 页面（Task 5）
- [x] 设定卡 CRUD 页面（Task 6）
- [x] 角色/设定 API（Task 2, 3）
- [x] TopBar 按钮（Task 4）
- [x] AI prompt 注入（Task 7）
- [x] Schema 扩展（Task 1）
- [x] 类型扩展（Task 1）

### Placeholder Scan
- 无 TBD / TODO
- 所有 prompt 模板均有实际内容
- 所有 API 路由均有完整错误处理
