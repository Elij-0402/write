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
      router.push(`/${projectId}/${data.id}`)
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
            onClick={() => router.push(`/${projectId}/${ch.id}`)}>
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
