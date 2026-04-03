'use client'
import { useUserAIModels } from '@/hooks/use-user-ai-models'
import { updateModel } from '@/hooks/use-user-ai-models'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, Check } from 'lucide-react'

interface ModelSwitcherProps {
  currentModelId?: string
  onSwitch?: (modelId: string) => void
}

export function ModelSwitcher({ currentModelId, onSwitch }: ModelSwitcherProps) {
  const { models, fetchModels } = useUserAIModels()

  const handleSwitch = async (modelId: string) => {
    await updateModel(modelId, { is_default: true })
    await fetchModels()
    onSwitch?.(modelId)
  }

  const currentModel = models.find(m => m.is_default) || models[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <span className="hidden sm:inline">模型：</span>
          <span className="font-medium">{currentModel?.name || '未配置'}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleSwitch(model.id)}
            className="flex items-center justify-between"
          >
            <span>{model.name}</span>
            {model.is_default && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {models.length === 0 && (
          <DropdownMenuItem disabled>暂无可用模型</DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a href="/settings/ai-models" className="cursor-pointer">
            管理模型
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
