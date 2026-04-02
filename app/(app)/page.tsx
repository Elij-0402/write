'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react'
import type { Project } from '@/types/database'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const { user } = useSupabase()
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
    if (!newTitle.trim() || !user) return
    setCreating(true)
    setError('')
    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({ title: newTitle.trim(), description: newDescription.trim() || null, user_id: user.id })
      .select()
      .single()
    if (insertError) {
      setError('创建失败，请重试')
      setCreating(false)
      return
    }
    if (data) {
      setProjects([data, ...projects])
      setCreateOpen(false)
      setNewTitle('')
      setNewDescription('')
      setCreating(false)
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
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setError(''); setNewTitle(''); setNewDescription('') } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> 新建书籍</Button>
          </DialogTrigger>
          <DialogContent describedBy="create-book-description">
            <DialogHeader>
              <DialogTitle>创建新书籍</DialogTitle>
              <DialogDescription id="create-book-description">
                输入书名和简介来创建一本新书
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); createProject() }} className="space-y-4 pt-4">
              <div>
                <Label>书名</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="我的小说" autoFocus />
              </div>
              <div>
                <Label>简介（可选）</Label>
                <Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="一句话描述你的故事" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={!newTitle.trim() || creating}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />创建中...</> : '创建'}
              </Button>
            </form>
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
              <div className="flex-1 cursor-pointer" role="button" tabIndex={0} onClick={() => router.push(`/${project.id}`)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/${project.id}`) } }}>
                <h3 className="font-medium">{project.title}</h3>
                <p className="text-sm text-muted-foreground">{project.description || '暂无描述'}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要删除《{project.title}》吗？此操作不可撤销，所有章节和内容将一并删除。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteProject(project.id)} className="bg-red-600 hover:bg-red-700">
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
