'use client'
import { useState, useRef, useCallback, type MutableRefObject } from 'react'

export function useAiTools(editorRef: MutableRefObject<any>, chapterId: string) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTool, setActiveTool] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [brainstormInput, setBrainstormInput] = useState('')
  const [contextMetadata, setContextMetadata] = useState<any>(null)
  const abortRef = useRef<AbortController | null>(null)

  const abortPrevious = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    return abortRef.current.signal
  }, [])

  const handleToolClick = useCallback(async (tool: string) => {
    setActiveTool(tool)

    if (tool === 'brainstorm') {
      setAiContent('')
      setAiError('')
      setPanelOpen(true)
      return
    }

    const editor = editorRef.current
    const cursorPosition = editor?.state?.selection?.from || 0

    if (tool === 'write') {
      const text = editor?.getText() || ''
      if (!text.trim()) {
        setAiError('请先在编辑器中输入一些文字')
        setPanelOpen(true)
        return
      }
      setPanelOpen(true)
      setAiLoading(true)
      setAiError('')
      setAiContent('')
      const signal = abortPrevious()
      try {
        const res = await fetch('/api/ai/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterId, cursorPosition }),
          signal,
        })
        const data = await res.json()
        if (data.error) setAiError(data.error)
        else {
          setAiContent(data.result)
          if (data.metadata) setContextMetadata(data.metadata)
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') setAiError(e.message)
      }
      setAiLoading(false)
      return
    }

    if (tool === 'rewrite') {
      const selectedText = editor?.state?.selection?.content()?.content?.firstChild?.textContent || ''
      if (!selectedText || selectedText.trim().length < 5) {
        alert('请先选中要改写的文字（至少 5 个字）')
        return
      }
      setPanelOpen(true)
      setAiLoading(true)
      setAiError('')
      setAiContent('')
      const signal = abortPrevious()
      try {
        const res = await fetch('/api/ai/rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterId, selectedText, cursorPosition }),
          signal,
        })
        const data = await res.json()
        if (data.error) setAiError(data.error)
        else {
          setAiContent(data.result)
          if (data.metadata) setContextMetadata(data.metadata)
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') setAiError(e.message)
      }
      setAiLoading(false)
      return
    }

    setPanelOpen(true)
  }, [chapterId, editorRef, abortPrevious])

  const handleBrainstormSubmit = useCallback(async () => {
    if (!brainstormInput.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiContent('')
    const signal = abortPrevious()
    try {
      const res = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, topic: brainstormInput }),
        signal,
      })
      const data = await res.json()
      if (data.error) setAiError(data.error)
      else {
        setAiContent(data.result)
        if (data.metadata) setContextMetadata(data.metadata)
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setAiError(e.message)
    }
    setAiLoading(false)
  }, [brainstormInput, chapterId, abortPrevious])

  const handleInsert = useCallback(() => {
    if (!aiContent || !editorRef.current) return
    editorRef.current.commands.insertContent(aiContent)
    setPanelOpen(false)
    setAiContent('')
  }, [aiContent, editorRef])

  return {
    panelOpen, setPanelOpen,
    activeTool, aiContent, setAiContent,
    aiLoading, aiError,
    brainstormInput, setBrainstormInput,
    handleToolClick, handleBrainstormSubmit, handleInsert,
    contextMetadata,
  }
}
