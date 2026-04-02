'use client'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  loading?: boolean
  error?: string
  value: string
  onChange: (v: string) => void
  onInsert: () => void
  mode?: 'write' | 'rewrite' | 'brainstorm'
  brainstormInput?: string
  onBrainstormInputChange?: (v: string) => void
  onBrainstormSubmit?: () => void
}

export function SidePanel({
  open, onClose, title, loading, error, value, onChange, onInsert,
  mode = 'write', brainstormInput, onBrainstormInputChange, onBrainstormSubmit
}: SidePanelProps) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-medium">{title}</h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {mode === 'brainstorm' && !loading && !error && (
            <div className="space-y-2">
              <Input
                placeholder="想探索什么？（如：如何让主角陷入两难抉择）"
                value={brainstormInput || ''}
                onChange={e => onBrainstormInputChange?.(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onBrainstormSubmit?.() }}
              />
              <Button onClick={onBrainstormSubmit} className="w-full">开始头脑风暴</Button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">正在思考...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 p-4 bg-red-50 dark:bg-red-950 rounded">{error}</div>
          ) : (
            <Textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              className="min-h-[300px] resize-none"
              placeholder="AI 生成的内容将显示在这里..."
            />
          )}
        </div>

        {(mode === 'write' || mode === 'rewrite') && (
          <div className="px-4 py-3 border-t flex gap-2">
            <Button onClick={onInsert} disabled={loading || !value} className="flex-1">
              插入到光标位置
            </Button>
            <Button variant="outline" onClick={onClose}>取消</Button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
