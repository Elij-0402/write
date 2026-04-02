'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Trash2, User } from 'lucide-react'
import { CharacterCardForm } from '@/components/character-card-form'
import type { Character } from '@/types/database'

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
      <Button variant="ghost" size="sm" onClick={() => router.push(`/${projectId}`)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回章节
      </Button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">角色卡</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> 新建角色</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : characters.length === 0 ? (
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
                    {ch.traits?.personality?.slice(0, 80) || '暂无性格描述'}
                    {(ch.traits?.personality?.length || 0) > 80 ? '...' : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteCharacter(ch.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
