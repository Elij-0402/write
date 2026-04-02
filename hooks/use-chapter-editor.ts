'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEditorStore } from '@/stores/editor-store'
import type { Chapter } from '@/types/database'

export function useChapterEditor(chapterId: string) {
  const [chapter, setChapter] = useState<Chapter>()
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const saveTimerRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef('')
  const supabaseRef = useRef(createClient())
  const wordCountRef = useRef(wordCount)
  wordCountRef.current = wordCount
  const { saveStatus, setSaveStatus } = useEditorStore()

  useEffect(() => {
    async function loadChapter() {
      const { data } = await supabaseRef.current
        .from('chapters')
        .select('*, project:projects(id, title)')
        .eq('id', chapterId)
        .single()
      if (data) {
        setChapter(data as Chapter)
        setContent((data as any).content || '')
        lastSavedRef.current = (data as any).content || ''
      }
    }
    loadChapter()
  }, [chapterId])

  const saveChapter = useCallback(async (contentToSave: string) => {
    setSaveStatus('saving')
    try {
      await supabaseRef.current
        .from('chapters')
        .update({ content: contentToSave, word_count: wordCountRef.current })
        .eq('id', chapterId)
      lastSavedRef.current = contentToSave
      setSaveStatus('saved')
    } catch {
      setSaveStatus('unsaved')
    }
  }, [chapterId, setSaveStatus])

  // Debounced auto-save (2s)
  useEffect(() => {
    if (!content || content === lastSavedRef.current) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveChapter(content), 2000)
    return () => clearTimeout(saveTimerRef.current)
  }, [content, saveChapter])

  async function handleTitleSave(newTitle: string) {
    if (!chapter) return
    await supabaseRef.current.from('chapters').update({ title: newTitle }).eq('id', chapterId)
    setChapter({ ...chapter, title: newTitle })
    setEditingTitle(false)
  }

  return {
    chapter, content, setContent,
    wordCount, setWordCount,
    editingTitle, setEditingTitle,
    handleTitleSave, saveStatus,
  }
}
