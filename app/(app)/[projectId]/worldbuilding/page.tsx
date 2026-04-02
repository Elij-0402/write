'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Trash2, Map } from 'lucide-react'
import { WorldbuildingCardForm } from '@/components/worldbuilding-card-form'
import type { Worldbuilding } from '@/types/database'

const CATEGORY_LABELS: Record<string, string> = {
  general: '通用', history: '历史', geography: '地理',
  culture: '文化', magic: '魔法', technology: '科技', other: '其他'
}

export default function WorldbuildingPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [items, setItems] = useState<Worldbuilding[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchItems() }, [projectId])

  async function fetchItems() {
    const { data } = await supabase.from('worldbuilding').select('*').eq('project_id', projectId).order('created_at')
    setItems(data || [])
    setLoading(false)
  }

  async function handleSave({ category, title, content }: { category: string; title: string; content: string }) {
    if (editingId) {
      await supabase.from('worldbuilding').update({ category, title, content }).eq('id', editingId)
    } else {
      await supabase.from('worldbuilding').insert({ project_id: projectId, category, title, content })
    }
    fetchItems()
    setShowForm(false)
    setEditingId(null)
  }

  async function deleteItem(id: string) {
    await supabase.from('worldbuilding').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  function startEdit(item: Worldbuilding) {
    setEditingId(item.id)
    setShowForm(true)
  }

  if (showForm) {
    const editing = editingId ? items.find(i => i.id === editingId) : null
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingId(null) }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">{editingId ? '编辑设定' : '新建设定'}</h1>
        </div>
        <WorldbuildingCardForm
          initialData={editing ? { category: editing.category, title: editing.title, content: editing.content } : undefined}
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
        <h1 className="text-2xl font-bold">世界观设定</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> 新建设定</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Map className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">还没有设定，创建第一个吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => startEdit(item)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.content?.slice(0, 80) || '暂无内容'}
                    {(item.content?.length || 0) > 80 ? '...' : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteItem(item.id)}>
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
