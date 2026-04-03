'use client'
import { useEffect, useState } from 'react'
import { useUserAIModels, type UserAIModel } from '@/hooks/use-user-ai-models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'

const PRESET_TEMPLATES = [
  { name: 'DeepSeek', base_url: 'https://api.deepseek.com', model_name: 'deepseek-chat' },
  { name: 'OpenAI', base_url: 'https://api.openai.com', model_name: 'gpt-4o' },
  { name: 'MiniMax', base_url: 'https://api.minimax.chat', model_name: 'MiniMax-Text-01' },
  { name: '自定义', base_url: '', model_name: '' },
] as const

interface FormState {
  name: string
  base_url: string
  api_key: string
  model_name: string
  is_default: boolean
}

export default function AIModelsSettingsPage() {
  const { models, loading, error, fetchModels, createModel, updateModel, deleteModel } = useUserAIModels()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<UserAIModel | null>(null)
  const [deletingModel, setDeletingModel] = useState<UserAIModel | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '', base_url: '', api_key: '', model_name: '', is_default: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchModels() }, [fetchModels])

  const openCreate = (template?: typeof PRESET_TEMPLATES[number]) => {
    setEditingModel(null)
    setForm({
      name: template?.name || '',
      base_url: template?.base_url || '',
      api_key: '',
      model_name: template?.model_name || '',
      is_default: models.length === 0,
    })
    setDialogOpen(true)
  }

  const openEdit = (model: UserAIModel) => {
    setEditingModel(model)
    setForm({
      name: model.name,
      base_url: model.base_url,
      api_key: model.api_key,
      model_name: model.model_name,
      is_default: model.is_default,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.base_url || !form.api_key || !form.model_name) return
    setSaving(true)
    try {
      if (editingModel) {
        await updateModel(editingModel.id, form)
      } else {
        await createModel(form)
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingModel) return
    await deleteModel(deletingModel.id)
    setDeleteDialogOpen(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">AI 模型设置</h1>
        <div className="relative">
          <Button onClick={() => openCreate()} size="sm">
            <Plus className="w-4 h-4 mr-1" /> 新建配置
          </Button>
        </div>
      </div>

      {/* 预设模板快捷入口 */}
      <div className="mb-6">
        <p className="text-sm text-muted mb-2">快速添加：</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_TEMPLATES.map((t) => (
            <Button key={t.name} variant="outline" size="sm" onClick={() => openCreate(t)}>
              {t.name}
            </Button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted">加载中...</p>}
      {error && <p className="text-sm text-error">{error}</p>}

      {/* 模型列表 */}
      <div className="space-y-3">
        {models.map((model) => (
          <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{model.name}</span>
                {model.is_default && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" /> 默认
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mt-1">{model.base_url}</p>
              <p className="text-xs text-muted mt-0.5">{model.model_name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => openEdit(model)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setDeletingModel(model); setDeleteDialogOpen(true) }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {models.length === 0 && !loading && (
          <p className="text-sm text-muted text-center py-8">暂无配置，点击上方按钮添加</p>
        )}
      </div>

      {/* 新建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModel ? '编辑配置' : '新建配置'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>名称</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="如：我的 DeepSeek" className="mt-1" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} placeholder="sk-..." className="mt-1" />
            </div>
            <div>
              <Label>Base URL</Label>
              <Input value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} placeholder="https://api.example.com" className="mt-1" />
            </div>
            <div>
              <Label>模型名称</Label>
              <Input value={form.model_name} onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))} placeholder="如：deepseek-chat" className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={form.is_default}
                onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
              />
              <Label htmlFor="is_default" className="font-normal">设为默认模型</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.api_key || !form.base_url || !form.model_name}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deletingModel?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}