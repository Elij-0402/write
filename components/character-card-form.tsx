'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CharacterTraits {
  appearance: string
  personality: string
  background: string
  motivation: string
  relationships: string
}

interface Props {
  initialData?: { name: string; traits: CharacterTraits }
  onSave: (data: { name: string; traits: CharacterTraits }) => Promise<void>
  onCancel: () => void
}

export function CharacterCardForm({ initialData, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialData?.name || '')
  const [traits, setTraits] = useState<CharacterTraits>(
    initialData?.traits || { appearance: '', personality: '', background: '', motivation: '', relationships: '' }
  )
  const [saving, setSaving] = useState(false)

  function updateTrait(key: keyof CharacterTraits, value: string) {
    setTraits(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, traits })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>角色名称</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="李明" />
      </div>
      <div>
        <Label>外貌</Label>
        <Textarea value={traits.appearance} onChange={e => updateTrait('appearance', e.target.value)} placeholder="身高、体型、五官特征..." rows={2} />
      </div>
      <div>
        <Label>性格</Label>
        <Textarea value={traits.personality} onChange={e => updateTrait('personality', e.target.value)} placeholder="性格特点、行为习惯..." rows={2} />
      </div>
      <div>
        <Label>背景</Label>
        <Textarea value={traits.background} onChange={e => updateTrait('background', e.target.value)} placeholder="成长经历、过去的事件..." rows={2} />
      </div>
      <div>
        <Label>动机</Label>
        <Textarea value={traits.motivation} onChange={e => updateTrait('motivation', e.target.value)} placeholder="这个角色想要什么..." rows={2} />
      </div>
      <div>
        <Label>关系网</Label>
        <Textarea value={traits.relationships} onChange={e => updateTrait('relationships', e.target.value)} placeholder="与其他角色的关系..." rows={2} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
      </div>
    </form>
  )
}
