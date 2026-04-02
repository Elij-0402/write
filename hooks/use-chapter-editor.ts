'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEditorStore } from '@/stores/editor-store'
import type { Chapter, Project } from '@/types/database'

export function useChapterEditor(chapterId: string) {
  const [chapter, setChapter] = useState<Chapter>()
  const [project, setProject] = useState<Project>()
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const saveTimerRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef('')
  const supabase = createClient()
  const { saveStatus, setSaveStatus } = useEditorStore()

  useEffect(() => {
    async function loadChapter() {
      const { data } = await supabase
        .from('chapters')
        .select('*, project:projects(id, title)')
        .eq('id', chapterId)
        .single()
      if (data) {
        setChapter(data as Chapter)
        setProject((data as any).project as Project)
        setContent((data as any).content || '')
        lastSavedRef.current = (data as any).content || ''
      }
    }
    loadChapter()
  }, [chapterId])

  const saveChapter = useCallback(async (contentToSave: string) => {
    setSaveStatus('saving')
    await supabase
      .from('chapters')
      .update({ content: contentToSave, word_count: wordCount })
      .eq('id', chapterId)
    lastSavedRef.current = contentToSave
    setSaveStatus('saved')
  }, [chapterId, wordCount, supabase, setSaveStatus])

  // Debounced auto-save (2s)
  useEffect(() => {
    if (!content || content === lastSavedRef.current) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveChapter(content), 2000)
    return () => clearTimeout(saveTimerRef.current)
  }, [content, saveChapter])

  async function handleTitleSave(newTitle: string) {
    await supabase.from('chapters').update({ title: newTitle }).eq('id', chapterId)
    setChapter({ ...chapter!, title: newTitle })
    setEditingTitle(false)
  }

  return {
    chapter, project, content, setContent,
    wordCount, setWordCount,
    editingTitle, setEditingTitle,
    handleTitleSave, saveStatus,
  }
}
