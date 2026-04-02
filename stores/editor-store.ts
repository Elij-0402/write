import { create } from 'zustand'

interface EditorState {
  content: string
  wordCount: number
  saveStatus: 'saved' | 'saving' | 'unsaved'
  setContent: (content: string) => void
  setWordCount: (count: number) => void
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  wordCount: 0,
  saveStatus: 'saved',
  setContent: (content) => set({ content, saveStatus: 'unsaved' }),
  setWordCount: (wordCount) => set({ wordCount }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}))
