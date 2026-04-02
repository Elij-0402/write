'use client'
import { useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { StatusBar } from '@/components/status-bar'
import { WritingCockpit } from '@/components/writing-cockpit'
import { useChapterEditor } from '@/hooks/use-chapter-editor'
import { useAiTools } from '@/hooks/use-ai-tools'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ChapterEditorPage() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>()
  const router = useRouter()
  const editorRef = useRef<any>(null)

  const editor = useChapterEditor(chapterId)
  const ai = useAiTools(editorRef, chapterId)

  const [consistencyLoading, setConsistencyLoading] = useState(false)
  const [consistencyResult, setConsistencyResult] = useState<any>(null)

  const handleConsistencyCheck = useCallback(async () => {
    setConsistencyLoading(true)
    setConsistencyResult(null)
    try {
      const res = await fetch('/api/ai/consistency-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      })
      const data = await res.json()
      setConsistencyResult(data)
    } catch (e: any) {
      setConsistencyResult({ error: e.message })
    }
    setConsistencyLoading(false)
  }, [chapterId])

  const handleReplace = useCallback(() => {
    if (!ai.aiContent || !editorRef.current) return
    const { from, to } = editorRef.current.state.selection
    if (from === to) {
      editorRef.current.commands.insertContent(ai.aiContent)
    } else {
      editorRef.current.chain().deleteRange({ from, to }).insertContent(ai.aiContent).run()
    }
    ai.setPanelOpen(false)
    ai.setAiContent('')
  }, [ai.aiContent, editorRef, ai])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/${projectId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        {editor.editingTitle ? (
          <Input
            defaultValue={editor.chapter?.title}
            autoFocus
            className="h-7 text-sm"
            onBlur={e => editor.handleTitleSave(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          />
        ) : (
          <span
            className="text-sm font-medium cursor-pointer hover:text-primary"
            onClick={() => editor.setEditingTitle(true)}
          >
            {editor.chapter?.title || '加载中...'}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-surface-warm">
        <TiptapEditor
          content={editor.content}
          onChange={editor.setContent}
          onWordCountChange={editor.setWordCount}
          placeholder="开始你的故事..."
          editorRef={editorRef}
        />
      </div>

      <StatusBar
        wordCount={editor.wordCount}
        chapterTitle={editor.chapter?.title || ''}
        saveStatus={editor.saveStatus}
      />

      <WritingCockpit
        open={ai.panelOpen}
        onClose={() => ai.setPanelOpen(false)}
        activeTool={ai.activeTool}
        aiContent={ai.aiContent}
        aiLoading={ai.aiLoading}
        aiError={ai.aiError}
        onToolClick={ai.handleToolClick}
        onAiContentChange={ai.setAiContent}
        onInsert={ai.handleInsert}
        onReplace={handleReplace}
        brainstormInput={ai.brainstormInput}
        onBrainstormInputChange={ai.setBrainstormInput}
        onBrainstormSubmit={ai.handleBrainstormSubmit}
        onConsistencyCheck={handleConsistencyCheck}
        consistencyLoading={consistencyLoading}
        consistencyResult={consistencyResult}
        contextMetadata={ai.contextMetadata}
      />
    </div>
  )
}
