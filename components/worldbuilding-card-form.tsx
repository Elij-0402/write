'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = [
  { value: 'general', label: '通用设定' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'culture', label: '文化' },
  { value: 'magic', label: '魔法/异能' },
  { value: 'technology', label: '科技' },
  { value: 'other', label: '其他' },
]

interface Props {
  initialData?: { category: string; title: string; content: string }
  onSave: (data: { category: string; title: string; content: string }) => Promise<void>
  onCancel: () => void
}

export function WorldbuildingCardForm({ initialData, onSave, onCancel }: Props) {
  const [category, setCategory] = useState(initialData?.category || 'general')
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ category, title, content })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>分类</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>标题</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="如：魔法体系的规则" />
      </div>
      <div>
        <Label>内容</Label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="详细设定..." rows={8} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
      </div>
    </form>
  )
}
