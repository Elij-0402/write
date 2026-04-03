# AI 模型自定义接入实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户在设置页面自定义接入多个 AI 模型，并在编辑器工具列快速切换

**Architecture:** 用户级联的 AI Provider 配置系统。基于现有 OpenAI 兼容格式，统一 `complete()` 方法。新建 `user_ai_models` 表存储用户配置，工厂模式创建 provider，API route 从用户默认配置动态构造。

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL + RLS), TypeScript, UI 组件库

---

## 文件结构

```
supabase/migrations/
  002_add_user_ai_models.sql          # 新建 user_ai_models 表

lib/ai/
  factory.ts                          # 新建：AIProviderFactory
  provider.ts                         # 现有接口不变
  deepseek.ts                         # 删除（合并到 factory）

app/api/ai/
  write/route.ts                      # 修改：从用户配置获取 provider
  rewrite/route.ts                   # 修改：同上
  brainstorm/route.ts                 # 修改：同上
  consistency-check/route.ts          # 修改：同上

app/(app)/
  settings/
    ai-models/
      page.tsx                        # 新建：AI 模型设置页
    layout.tsx                        # 可能需要调整

components/
  writing-cockpit.tsx                 # 修改：添加工具列模型切换下拉
  model-switcher.tsx                 # 新建：模型切换下拉组件

hooks/
  use-user-ai-models.ts              # 新建：用户 AI 模型 CRUD hook
```

---

## Task 1: 数据库迁移 — `user_ai_models` 表

**Files:**
- Create: `supabase/migrations/002_add_user_ai_models.sql`
- Test: `supabase/schema.sql`（验证 RLS 策略）

- [ ] **Step 1: 编写迁移脚本**

```sql
-- supabase/migrations/002_add_user_ai_models.sql
-- AI 模型自定义接入 — 用户 AI 模型配置表

CREATE TABLE IF NOT EXISTS public.user_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.user_ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ai models" ON public.user_ai_models
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_ai_models_user_default
  ON public.user_ai_models(user_id, is_default)
  WHERE is_default = true;
```

- [ ] **Step 2: 验证迁移语法**

在 Supabase SQL Editor 中运行迁移脚本，确认执行成功。

- [ ] **Step 3: 提交**

```bash
git add supabase/migrations/002_add_user_ai_models.sql
git commit -m "feat(db): add user_ai_models table for custom AI provider configuration"
```

---

## Task 2: AI Provider 工厂

**Files:**
- Create: `lib/ai/factory.ts`
- Modify: `lib/ai/deepseek.ts`（删除）
- Test: `lib/ai/__tests__/factory.test.ts`（新建）

- [ ] **Step 1: 编写测试**

```typescript
// lib/ai/__tests__/factory.test.ts
import { createAIProvider } from '../factory'

describe('createAIProvider', () => {
  it('creates a provider with correct config', () => {
    const provider = createAIProvider({
      base_url: 'https://api.test.com',
      api_key: 'test-key',
      model_name: 'test-model',
    })
    expect(provider).toBeDefined()
    expect(typeof provider.complete).toBe('function')
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx jest lib/ai/__tests__/factory.test.ts`
Expected: FAIL — file does not exist

- [ ] **Step 3: 编写工厂实现**

```typescript
// lib/ai/factory.ts
import type { AIProvider } from './provider'

export interface AIProviderConfig {
  base_url: string
  api_key: string
  model_name: string
}

export function createAIProvider(config: AIProviderConfig): AIProvider {
  return {
    async complete(prompt, options) {
      const res = await fetch(`${config.base_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`,
        },
        body: JSON.stringify({
          model: config.model_name,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.max_tokens ?? 1024,
          temperature: options?.temperature ?? 0.8,
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      return data.choices[0].message.content as string
    },
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx jest lib/ai/__tests__/factory.test.ts`
Expected: PASS

- [ ] **Step 5: 删除旧文件**

```bash
rm lib/ai/deepseek.ts
```

- [ ] **Step 6: 提交**

```bash
git add lib/ai/factory.ts lib/ai/__tests__/factory.test.ts
git rm lib/ai/deepseek.ts
git commit -m "feat(ai): replace DeepSeekProvider with generic AIProviderFactory"
```

---

## Task 3: 用户 AI 模型 CRUD Hook

**Files:**
- Create: `hooks/use-user-ai-models.ts`
- Test: `hooks/__tests__/use-user-ai-models.test.ts`（新建）

- [ ] **Step 1: 编写独立操作函数**

```typescript
// lib/ai-model-operations.ts
import { createClient } from '@/lib/supabase/client'

export interface UserAIModel {
  id: string
  user_id: string
  name: string
  base_url: string
  api_key: string
  model_name: string
  is_default: boolean
  created_at: string
}

export async function fetchUserAIModels(): Promise<UserAIModel[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('user_ai_models')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createUserAIModel(model: Omit<UserAIModel, 'id' | 'user_id' | 'created_at'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (model.is_default) {
    await supabase.from('user_ai_models')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('user_ai_models')
    .insert({ ...model, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateUserAIModel(id: string, updates: Partial<UserAIModel>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (updates.is_default) {
    await supabase.from('user_ai_models')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { error } = await supabase
    .from('user_ai_models')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function deleteUserAIModel(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: models } = await supabase
    .from('user_ai_models')
    .select('id, is_default')
    .eq('user_id', user.id)

  const modelToDelete = models?.find(m => m.id === id)
  const wasDefault = modelToDelete?.is_default

  const { error } = await supabase
    .from('user_ai_models')
    .delete()
    .eq('id', id)

  if (error) throw error

  if (wasDefault && models && models.length > 1) {
    const remaining = models.filter(m => m.id !== id)
    if (remaining.length > 0) {
      await supabase.from('user_ai_models')
        .update({ is_default: true })
        .eq('id', remaining[0].id)
    }
  }
}
```

- [ ] **Step 2: 编写 Hook**

```typescript
// hooks/use-user-ai-models.ts
'use client'
import { useState, useCallback } from 'react'
import { fetchUserAIModels, createUserAIModel, updateUserAIModel, deleteUserAIModel, type UserAIModel } from '@/lib/ai-model-operations'

export { type UserAIModel }

export function useUserAIModels() {
  const [models, setModels] = useState<UserAIModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUserAIModels()
      setModels(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createModel = useCallback(async (model: Omit<UserAIModel, 'id' | 'user_id' | 'created_at'>) => {
    await createUserAIModel(model)
    await fetchModels()
  }, [fetchModels])

  const updateModel = useCallback(async (id: string, updates: Partial<UserAIModel>) => {
    await updateUserAIModel(id, updates)
    await fetchModels()
  }, [fetchModels])

  const deleteModel = useCallback(async (id: string) => {
    await deleteUserAIModel(id)
    await fetchModels()
  }, [fetchModels])

  const getDefaultModel = useCallback(() => {
    return models.find(m => m.is_default) || models[0] || null
  }, [models])

  return {
    models,
    loading,
    error,
    fetchModels,
    createModel,
    updateModel,
    deleteModel,
    getDefaultModel,
  }
}
```

- [ ] **Step 3: 同时导出独立函数供组件使用**

在 `hooks/use-user-ai-models.ts` 末尾添加：

```typescript
export { updateUserAIModel as updateModel, deleteUserAIModel as deleteModel } from '@/lib/ai-model-operations'
```

- [ ] **Step 2: 提交**

```bash
git add hooks/use-user-ai-models.ts
git commit -m "feat(hooks): add useUserAIModels hook for CRUD operations"
```

---

## Task 4: AI 模型设置页面

**Files:**
- Create: `app/(app)/settings/ai-models/page.tsx`
- Modify: `app/(app)/layout.tsx`（添加设置页面链接）

- [ ] **Step 1: 创建设置页面**

```tsx
// app/(app)/settings/ai-models/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useUserAIModels, type UserAIModel } from '@/hooks/use-user-ai-models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'

const PRESET_TEMPLATES = [
  { name: 'DeepSeek', base_url: 'https://api.deepseek.com', model_name: 'deepseek-chat' },
  { name: 'OpenAI', base_url: 'https://api.openai.com', model_name: 'gpt-4o' },
  { name: 'MiniMax', base_url: 'https://api.minimax.chat', model_name: 'MiniMax-Text-01' },
  { name: '自定义', base_url: '', model_name: '' },
] as const

interface FormState {
  name: string
  base_url: string
  api_key: string
  model_name: string
  is_default: boolean
}

export default function AIModelsSettingsPage() {
  const { models, loading, error, fetchModels, createModel, updateModel, deleteModel } = useUserAIModels()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<UserAIModel | null>(null)
  const [deletingModel, setDeletingModel] = useState<UserAIModel | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '', base_url: '', api_key: '', model_name: '', is_default: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchModels() }, [fetchModels])

  const openCreate = (template?: typeof PRESET_TEMPLATES[number]) => {
    setEditingModel(null)
    setForm({
      name: template?.name || '',
      base_url: template?.base_url || '',
      api_key: '',
      model_name: template?.model_name || '',
      is_default: models.length === 0,
    })
    setDialogOpen(true)
  }

  const openEdit = (model: UserAIModel) => {
    setEditingModel(model)
    setForm({
      name: model.name,
      base_url: model.base_url,
      api_key: model.api_key,
      model_name: model.model_name,
      is_default: model.is_default,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.base_url || !form.api_key || !form.model_name) return
    setSaving(true)
    try {
      if (editingModel) {
        await updateModel(editingModel.id, form)
      } else {
        await createModel(form)
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingModel) return
    await deleteModel(deletingModel.id)
    setDeleteDialogOpen(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">AI 模型设置</h1>
        <div className="relative">
          <Button onClick={() => openCreate()} size="sm">
            <Plus className="w-4 h-4 mr-1" /> 新建配置
          </Button>
        </div>
      </div>

      {/* 预设模板快捷入口 */}
      <div className="mb-6">
        <p className="text-sm text-muted mb-2">快速添加：</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_TEMPLATES.map((t) => (
            <Button key={t.name} variant="outline" size="sm" onClick={() => openCreate(t)}>
              {t.name}
            </Button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted">加载中...</p>}
      {error && <p className="text-sm text-error">{error}</p>}

      {/* 模型列表 */}
      <div className="space-y-3">
        {models.map((model) => (
          <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{model.name}</span>
                {model.is_default && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" /> 默认
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mt-1">{model.base_url}</p>
              <p className="text-xs text-muted mt-0.5">{model.model_name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => openEdit(model)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setDeletingModel(model); setDeleteDialogOpen(true) }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {models.length === 0 && !loading && (
          <p className="text-sm text-muted text-center py-8">暂无配置，点击上方按钮添加</p>
        )}
      </div>

      {/* 新建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModel ? '编辑配置' : '新建配置'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>名称</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="如：我的 DeepSeek" className="mt-1" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} placeholder="sk-..." className="mt-1" />
            </div>
            <div>
              <Label>Base URL</Label>
              <Input value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} placeholder="https://api.example.com" className="mt-1" />
            </div>
            <div>
              <Label>模型名称</Label>
              <Input value={form.model_name} onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))} placeholder="如：deepseek-chat" className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={form.is_default}
                onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
              />
              <Label htmlFor="is_default" className="font-normal">设为默认模型</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.api_key || !form.base_url || !form.model_name}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deletingModel?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 2: 验证页面渲染**

Run: `cd app/(app)/settings/ai-models && npx tsc --noEmit page.tsx`
Expected: 无编译错误

- [ ] **Step 3: 提交**

```bash
git add app/\(app\)/settings/ai-models/page.tsx
git commit -m "feat(settings): add AI models configuration page"
```

---

## Task 5: API Route 适配 — 从用户默认配置构造 Provider

**Files:**
- Modify: `app/api/ai/write/route.ts:1-37`
- Modify: `app/api/ai/rewrite/route.ts:1-34`
- Modify: `app/api/ai/brainstorm/route.ts`
- Modify: `app/api/ai/consistency-check/route.ts`

- [ ] **Step 1: 创建获取用户默认 provider 的辅助函数**

```typescript
// lib/ai/get-user-provider.ts
import { createClient } from '@/lib/supabase/server'
import { createAIProvider } from './factory'

export async function getUserAIModel() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('user_ai_models')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    const { data: fallback } = await supabase
      .from('user_ai_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!fallback) throw new Error('未配置 AI 模型，请先在设置中添加')
    return fallback
  }

  return data
}

export async function getUserAIProvider() {
  const model = await getUserAIModel()
  return createAIProvider({
    base_url: model.base_url,
    api_key: model.api_key,
    model_name: model.model_name,
  })
}
```

- [ ] **Step 2: 修改 write route**

```typescript
// app/api/ai/write/route.ts (修改后)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAIProvider } from '@/lib/ai/get-user-provider'
import { assembleContext } from '@/lib/ai/context-assembler'
import { buildWritePrompt } from '@/lib/prompts/write'

export async function POST(req: Request) {
  try {
    const { chapterId, cursorPosition = 0, wordCount } = await req.json()

    if (!chapterId) {
      return NextResponse.json({ error: '缺少章节 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await assembleContext(supabase, chapterId, cursorPosition, 'write')

    if (!ctx.textWindow.trim()) {
      return NextResponse.json({ error: '请先在编辑器中输入一些文字' }, { status: 400 })
    }

    const provider = await getUserAIProvider()
    const prompt = buildWritePrompt(ctx, wordCount || 300)
    const result = await provider.complete(prompt, { max_tokens: 1024, temperature: 0.85 })

    return NextResponse.json({ result: result.trim(), metadata: ctx.metadata })
  } catch (err: any) {
    console.error('AI write error:', err)
    if (err.message?.includes('not found')) {
      return NextResponse.json({ error: '章节未找到' }, { status: 404 })
    }
    if (err.message?.includes('未配置 AI 模型')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
```

- [ ] **Step 3: 修改 rewrite route**

```typescript
// app/api/ai/rewrite/route.ts (修改后)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAIProvider } from '@/lib/ai/get-user-provider'
import { assembleContext } from '@/lib/ai/context-assembler'
import { buildRewritePrompt } from '@/lib/prompts/rewrite'

export async function POST(req: Request) {
  try {
    const { chapterId, selectedText, cursorPosition = 0 } = await req.json()

    if (!selectedText || selectedText.trim().length < 5) {
      return NextResponse.json({ error: '请选择要改写的文字（至少 5 个字）' }, { status: 400 })
    }

    if (!chapterId) {
      return NextResponse.json({ error: '缺少章节 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await assembleContext(supabase, chapterId, cursorPosition, 'rewrite')

    const provider = await getUserAIProvider()
    const prompt = buildRewritePrompt(selectedText, ctx)
    const result = await provider.complete(prompt, { max_tokens: 2048, temperature: 0.9 })

    return NextResponse.json({ result: result.trim(), metadata: ctx.metadata })
  } catch (err: any) {
    console.error('AI rewrite error:', err)
    if (err.message?.includes('未配置 AI 模型')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
```

- [ ] **Step 4: 修改 brainstorm route**

```typescript
// app/api/ai/brainstorm/route.ts (完整替换)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAIProvider } from '@/lib/ai/get-user-provider'
import { assembleContext, createEmptyContext } from '@/lib/ai/context-assembler'
import { buildBrainstormPrompt } from '@/lib/prompts/brainstorm'

export async function POST(req: Request) {
  try {
    const { chapterId, topic } = await req.json()

    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: '请输入想探索的内容' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const provider = await getUserAIProvider()

    if (chapterId) {
      const ctx = await assembleContext(supabase, chapterId, Infinity, 'brainstorm')
      const prompt = buildBrainstormPrompt(topic, ctx)
      const result = await provider.complete(prompt, { max_tokens: 1536, temperature: 0.9 })
      return NextResponse.json({ result: result.trim(), metadata: ctx.metadata })
    }

    // Fallback: no chapter context (e.g. called from non-editor page)
    const emptyCtx = createEmptyContext('brainstorm')
    const prompt = buildBrainstormPrompt(topic, emptyCtx)
    const result = await provider.complete(prompt, { max_tokens: 1536, temperature: 0.9 })
    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    console.error('AI brainstorm error:', err)
    if (err.message?.includes('未配置 AI 模型')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
```

- [ ] **Step 5: 修改 consistency-check route**

```typescript
// app/api/ai/consistency-check/route.ts (完整替换)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAIProvider } from '@/lib/ai/get-user-provider'
import { assembleContext } from '@/lib/ai/context-assembler'
import { buildConsistencyPrompt } from '@/lib/prompts/consistency'

export async function POST(req: Request) {
  try {
    const { chapterId } = await req.json()

    if (!chapterId) {
      return NextResponse.json({ error: '缺少章节 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await assembleContext(supabase, chapterId, Infinity, 'consistency')

    if (ctx.textWindow.length < 100) {
      return NextResponse.json({ error: '章节内容太少，无法进行有意义的一致性检查（至少需要 100 字）' }, { status: 400 })
    }

    if (ctx.characters.length === 0) {
      return NextResponse.json({ error: '没有角色卡数据。请先创建角色卡，一致性检查需要对照角色设定来发现冲突。' }, { status: 400 })
    }

    const prompt = buildConsistencyPrompt(ctx)
    const provider = await getUserAIProvider()
    const raw = await provider.complete(prompt, { max_tokens: 2048, temperature: 0.3 })

    let conflicts = []
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) {
        conflicts = []
      } else {
        const validTypes = ['character', 'timeline', 'address', 'worldbuilding']
        const validSeverities = ['high', 'medium', 'low']
        conflicts = parsed.filter((item: any) =>
          item &&
          typeof item.type === 'string' && validTypes.includes(item.type) &&
          typeof item.severity === 'string' && validSeverities.includes(item.severity) &&
          typeof item.description === 'string' && item.description.length > 0
        )
      }
    } catch {
      console.error('Failed to parse AI consistency response:', raw.slice(0, 500))
      return NextResponse.json({ error: 'AI 返回了无法解析的结果，请重试' }, { status: 422 })
    }

    return NextResponse.json({ conflicts, metadata: ctx.metadata })
  } catch (err: any) {
    console.error('Consistency check error:', err)
    const msg = err.message || 'AI 生成失败'
    if (msg.includes('429') || msg.includes('rate')) {
      return NextResponse.json({ error: 'AI 服务繁忙，请稍后重试' }, { status: 429 })
    }
    if (msg.includes('timeout') || msg.includes('Timeout')) {
      return NextResponse.json({ error: 'AI 响应超时，请重试' }, { status: 504 })
    }
    if (msg.includes('未配置 AI 模型')) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

- [ ] **Step 6: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add lib/ai/get-user-provider.ts
git add app/api/ai/write/route.ts app/api/ai/rewrite/route.ts
git commit -m "feat(api): adapt AI routes to use user-configured provider"
```

---

## Task 6: 编辑器工具列模型切换下拉

**Files:**
- Create: `components/model-switcher.tsx`
- Modify: `components/writing-cockpit.tsx:39-66`
- Modify: `hooks/use-ai-tools.ts`（添加模型切换逻辑）

- [ ] **Step 1: 创建 ModelSwitcher 组件**

```tsx
// components/model-switcher.tsx
'use client'
import { useUserAIModels } from '@/hooks/use-user-ai-models'
import { updateModel } from '@/hooks/use-user-ai-models'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, Check } from 'lucide-react'

interface ModelSwitcherProps {
  currentModelId?: string
  onSwitch?: (modelId: string) => void
}

export function ModelSwitcher({ currentModelId, onSwitch }: ModelSwitcherProps) {
  const { models, fetchModels } = useUserAIModels()

  const handleSwitch = async (modelId: string) => {
    await updateModel(modelId, { is_default: true })
    await fetchModels()
    onSwitch?.(modelId)
  }

  const currentModel = models.find(m => m.is_default) || models[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <span className="hidden sm:inline">模型：</span>
          <span className="font-medium">{currentModel?.name || '未配置'}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleSwitch(model.id)}
            className="flex items-center justify-between"
          >
            <span>{model.name}</span>
            {model.is_default && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {models.length === 0 && (
          <DropdownMenuItem disabled>暂无可用模型</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings/ai-models" className="cursor-pointer">
            管理模型
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: 修改 WritingCockpit添加工具列区域**

在 `writing-cockpit.tsx` 的 TabsList 区域添加工具列（在 PROJECT_TOOLS 后面）：

```tsx
// components/writing-cockpit.tsx (在 AI_TOOLS 后面添加工具列)

// 在文件顶部添加导入
import { ModelSwitcher } from './model-switcher'

// 在 TabsList 中，AI_TOOLS 按钮组后面添加：
<div className="h-4 w-px bg-border mx-1" />
<ModelSwitcher />
```

完整修改TabsList区域（lines 43-68）:

```tsx
<TabsList className="rounded-none border-b border-default bg-transparent px-4 h-10 justify-start gap-0">
  <TabsTrigger value="writing" className={tabTriggerClass}>写作</TabsTrigger>
  <TabsTrigger value="check" className={tabTriggerClass}>检查</TabsTrigger>
  <TabsTrigger value="characters" className={tabTriggerClass}>角色</TabsTrigger>
  <TabsTrigger value="context" className={tabTriggerClass}>透视</TabsTrigger>
  <div className="flex-1" />
  <ModelSwitcher />
</TabsList>
```

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add components/model-switcher.tsx components/writing-cockpit.tsx
git commit -m "feat(ui): add model switcher dropdown to writing cockpit toolbar"
```

---

## Task 7: 收尾 — 验证和清理

- [ ] **Step 1: 全面类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 2: ESLint 检查**

Run: `npx eslint . --quiet`
Expected: 无错误

- [ ] **Step 3: 验证完整流程**

1. 访问 `/settings/ai-models` 创建新模型配置
2. 选择预设模板（如 DeepSeek）快速创建
3. 在编辑器中使用 AI 工具，确认正常工作
4. 测试模型切换下拉

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: complete AI model custom接入 implementation"
```

---

## 依赖关系

```
Task 1 (DB Migration)
    ↓
Task 2 (Factory)        ← 并行
Task 3 (Hook)           ← 并行
    ↓
Task 4 (Settings Page)  ← 依赖 Task 3
    ↓
Task 5 (API Routes)     ← 依赖 Task 2, Task 3
    ↓
Task 6 (Model Switcher) ← 依赖 Task 3, Task 4
    ↓
Task 7 (Cleanup)
```
