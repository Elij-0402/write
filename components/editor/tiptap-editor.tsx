'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  onWordCountChange: (count: number) => void
  placeholder?: string
  className?: string
  editorRef?: React.MutableRefObject<any>
}

export function TiptapEditor({ content, onChange, onWordCountChange, placeholder, className, editorRef }: TiptapEditorProps) {
  const lastSavedRef = useRef(content)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: placeholder || '开始写作...' }),
      Typography,
    ],
    content: content ? JSON.parse(content) : '',
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON())
      const text = editor.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      onChange(json)
      onWordCountChange(words)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] font-serif leading-[2] text-lg md:text-xl py-12 px-5 md:px-20',
          className
        ),
      },
    },
  })

  // 同步外部内容变化（如章节切换）
  useEffect(() => {
    if (editor && content !== lastSavedRef.current) {
      try {
        editor.commands.setContent(content ? JSON.parse(content) : '', false)
        lastSavedRef.current = content
      } catch {
        editor.commands.setContent('', false)
      }
    }
  }, [content, editor])

  // 暴露 editor 实例用于外部插入
  useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = editor
    }
  }, [editor, editorRef])

  return <EditorContent editor={editor} className="flex-1 overflow-auto" />
}

export function useTiptapEditor() {
  const ref = useRef<any>(null)
  return ref
}
