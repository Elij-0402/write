'use client'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { PenLine, RefreshCw, Lightbulb, User, Map, Home } from 'lucide-react'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  projectId?: string
  onToolClick: (tool: string) => void
  onProjectToolClick: (tool: string) => void
  onNavigateHome: () => void
}

export function MobileMenu({ open, onClose, projectId, onToolClick, onProjectToolClick, onNavigateHome }: MobileMenuProps) {
  return (
    <Sheet open={open} onClose={onClose} side="left">
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b">
          <h2 className="font-medium text-sm">AI 小说工作台</h2>
        </div>

        <nav className="flex-1 overflow-auto p-2 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={onNavigateHome}>
            <Home className="w-4 h-4" />
            项目列表
          </Button>

          {projectId && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">AI 工具</div>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => onToolClick('write')}>
                <PenLine className="w-4 h-4" />
                续写
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => onToolClick('rewrite')}>
                <RefreshCw className="w-4 h-4" />
                改写
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => onToolClick('brainstorm')}>
                <Lightbulb className="w-4 h-4" />
                头脑风暴
              </Button>

              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">项目管理</div>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => onProjectToolClick('characters')}>
                <User className="w-4 h-4" />
                角色
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => onProjectToolClick('worldbuilding')}>
                <Map className="w-4 h-4" />
                设定
              </Button>
            </>
          )}
        </nav>
      </div>
    </Sheet>
  )
}
