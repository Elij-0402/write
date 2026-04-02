'use client'
import Link from 'next/link'
import { PenLine, RefreshCw, Lightbulb, Settings, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AI_TOOLS = [
  { id: 'write', label: '续写', icon: PenLine },
  { id: 'rewrite', label: '改写', icon: RefreshCw },
  { id: 'brainstorm', label: '头脑风暴', icon: Lightbulb },
] as const

interface TopBarProps {
  projectTitle?: string
  onToolClick: (tool: string) => void
  onMenuClick: () => void
}

export function TopBar({ projectTitle, onToolClick, onMenuClick }: TopBarProps) {
  return (
    <header className="h-12 border-b flex items-center px-4 gap-2 shrink-0">
      <Button variant="ghost" size="icon" onClick={onMenuClick} title="项目列表">
        <Menu className="w-4 h-4" />
      </Button>

      <span className="text-sm font-medium text-muted-foreground">
        {projectTitle || 'AI 小说工作台'}
      </span>

      <div className="flex-1" />

      {AI_TOOLS.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="sm"
          onClick={() => onToolClick(id)}
          className={cn('gap-1.5', !projectTitle && 'opacity-50 pointer-events-none')}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}

      <Link href="/settings" className="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium hover:bg-accent transition-colors">
        <Settings className="w-4 h-4" />
      </Link>
    </header>
  )
}
