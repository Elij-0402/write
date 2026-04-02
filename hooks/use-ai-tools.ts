'use client'
import { useState, useRef, useCallback, useEffect, type MutableRefObject } from 'react'

export function useAiTools(editorRef: MutableRefObject<any>, chapterId: string) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTool, setActiveTool] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [brainstormInput, setBrainstormInput] = useState('')
  const [contextMetadata, setContextMetadata] = useState<any>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const abortPrevious = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    return abortRef.current.signal
  }, [])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const callAiEndpoint = useCallback(async (url: string, body: Record<string, unknown>) => {
    setPanelOpen(true)
    setAiLoading(true)
    setAiError('')
    setAiContent('')
    const signal = abortPrevious()
    const currentRequestId = ++requestIdRef.current
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      })
      const data = await res.json()
      if (requestIdRef.current !== currentRequestId) return
      if (data.error) setAiError(data.error)
      else {
        setAiContent(data.result)
        if (data.metadata) setContextMetadata(data.metadata)
      }
    } catch (e: any) {
      if (requestIdRef.current !== currentRequestId) return
      if (e.name !== 'AbortError') setAiError(e.message)
    }
    if (requestIdRef.current === currentRequestId) {
      setAiLoading(false)
    }
  }, [abortPrevious])

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
      callAiEndpoint('/api/ai/write', { chapterId, cursorPosition })
      return
    }

    if (tool === 'rewrite') {
      const { from, to } = editor?.state?.selection || {}
      const selectedText = (from !== undefined && to !== undefined && from !== to)
        ? editor.state.doc.textBetween(from, to, '\n')
        : ''
      if (!selectedText || selectedText.trim().length < 5) {
        alert('请先选中要改写的文字（至少 5 个字）')
        return
      }
      callAiEndpoint('/api/ai/rewrite', { chapterId, selectedText, cursorPosition })
      return
    }

    setPanelOpen(true)
  }, [chapterId, editorRef, callAiEndpoint])

  const handleBrainstormSubmit = useCallback(async () => {
    if (!brainstormInput.trim()) return
    callAiEndpoint('/api/ai/brainstorm', { chapterId, topic: brainstormInput })
  }, [brainstormInput, chapterId, callAiEndpoint])

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
