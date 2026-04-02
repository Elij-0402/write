'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { StatusBar } from '@/components/status-bar'
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
  const [brainstormInput, setBrainstormInput] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const saveTimerRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef('')
  const supabase = createClient()
  const router = useRouter()
  const editorRef = useRef<any>(null)
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

  async function handleToolClick(tool: string) {
    setActiveTool(tool)

    if (tool === 'brainstorm') {
      setAiContent('')
      setAiError('')
      setPanelOpen(true)
      return
    }

    if (tool === 'write') {
      const editor = editorRef.current
      const text = editor?.getText() || ''
      const context = text.slice(-200)
      if (!context.trim()) { setAiError('请先在编辑器中输入一些文字'); setPanelOpen(true); return }
      setPanelOpen(true)
      setAiLoading(true)
      setAiError('')
      setAiContent('')
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
      return
    }

    if (tool === 'rewrite') {
      const selectedText = editorRef.current?.state?.selection?.content()?.content?.firstChild?.textContent || ''
      if (!selectedText || selectedText.trim().length < 5) {
        alert('请先选中要改写的文字（至少 5 个字）')
        return
      }
      setPanelOpen(true)
      setAiLoading(true)
      setAiError('')
      setAiContent('')
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
      return
    }

    setPanelOpen(true)
  }

  async function handleBrainstormSubmit() {
    if (!brainstormInput.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiContent('')
    try {
      const res = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: brainstormInput }),
      })
      const data = await res.json()
      if (data.error) setAiError(data.error)
      else setAiContent(data.result)
    } catch (e: any) { setAiError(e.message) }
    setAiLoading(false)
  }

  function handleInsert() {
    if (!aiContent || !editorRef.current) return
    editorRef.current.commands.insertContent(aiContent)
    setPanelOpen(false)
    setAiContent('')
  }

  function extractTextFromJson(jsonStr: string): string {
    try {
      const doc = JSON.parse(jsonStr)
      function getText(node: any): string {
        if (!node) return ''
        if (typeof node.text === 'string') return node.text
        if (node.content) return node.content.map(getText).join('')
        return ''
      }
      return getText(doc)
    } catch {
      return ''
    }
  }

  async function handleTitleSave(newTitle: string) {
    await supabase.from('chapters').update({ title: newTitle }).eq('id', chapterId)
    setChapter({ ...chapter!, title: newTitle })
    setEditingTitle(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/${projectId}`)}>
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

      <div className="flex-1 overflow-hidden bg-surface-warm">
        <TiptapEditor
          content={content}
          onChange={setContent}
          onWordCountChange={setWordCount}
          placeholder="开始你的故事..."
          editorRef={editorRef}
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
        mode={activeTool as any}
        brainstormInput={brainstormInput}
        onBrainstormInputChange={setBrainstormInput}
        onBrainstormSubmit={handleBrainstormSubmit}
      />
    </div>
  )
}
