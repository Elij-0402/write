'use client'
import { Sheet } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Loader2, PenLine, RefreshCw, Lightbulb } from 'lucide-react'

interface WritingCockpitProps {
  open: boolean
  onClose: () => void
  activeTool: string
  aiContent: string
  aiLoading: boolean
  aiError: string
  onToolClick: (tool: string) => void
  onAiContentChange: (v: string) => void
  onInsert: () => void
  brainstormInput: string
  onBrainstormInputChange: (v: string) => void
  onBrainstormSubmit: () => void
  contextMetadata?: any
}

export function WritingCockpit({
  open, onClose, activeTool, aiContent, aiLoading, aiError,
  onToolClick, onAiContentChange, onInsert,
  brainstormInput, onBrainstormInputChange, onBrainstormSubmit,
  contextMetadata,
}: WritingCockpitProps) {
  return (
    <Sheet open={open} onClose={onClose} className="bg-surface">
      <div className="flex flex-col h-full">
        <Tabs defaultValue="writing" className="flex flex-col h-full">
          <TabsList className="rounded-none border-b border-default bg-transparent px-4 h-10 justify-start gap-0">
            <TabsTrigger
              value="writing"
              className="rounded-none border-b-2 border-transparent text-[13px] font-medium font-sans text-muted data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              写作
            </TabsTrigger>
            <TabsTrigger
              value="check"
              className="rounded-none border-b-2 border-transparent text-[13px] font-medium font-sans text-muted data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              检查
            </TabsTrigger>
            <TabsTrigger
              value="characters"
              className="rounded-none border-b-2 border-transparent text-[13px] font-medium font-sans text-muted data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              角色
            </TabsTrigger>
            <TabsTrigger
              value="context"
              className="rounded-none border-b-2 border-transparent text-[13px] font-medium font-sans text-muted data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              透视
            </TabsTrigger>
          </TabsList>

          {/* 写作 tab */}
          <TabsContent value="writing" className="flex-1 overflow-auto p-4 mt-0">
            <div className="space-y-3">
              {/* Tool buttons */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => onToolClick('write')}
                  disabled={aiLoading}
                >
                  <PenLine className="w-4 h-4" />
                  续写
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => onToolClick('rewrite')}
                  disabled={aiLoading}
                >
                  <RefreshCw className="w-4 h-4" />
                  改写
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => onToolClick('brainstorm')}
                  disabled={aiLoading}
                >
                  <Lightbulb className="w-4 h-4" />
                  头脑风暴
                </Button>
              </div>

              {/* Brainstorm input */}
              {activeTool === 'brainstorm' && !aiLoading && !aiError && !aiContent && (
                <div className="space-y-2">
                  <Input
                    placeholder="想探索什么？（如：如何让主角陷入两难抉择）"
                    value={brainstormInput}
                    onChange={e => onBrainstormInputChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') onBrainstormSubmit() }}
                  />
                  <Button onClick={onBrainstormSubmit} className="w-full">
                    开始头脑风暴
                  </Button>
                </div>
              )}

              {/* Loading state */}
              {aiLoading && (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">AI 思考中...</span>
                </div>
              )}

              {/* Error state */}
              {aiError && !aiLoading && (
                <div className="text-sm text-error p-4 bg-error/10 rounded-lg">
                  {aiError}
                </div>
              )}

              {/* AI result */}
              {aiContent && !aiLoading && (
                <>
                  <Textarea
                    value={aiContent}
                    onChange={e => onAiContentChange(e.target.value)}
                    className="min-h-[300px] resize-none"
                    placeholder="AI 生成的内容将显示在这里..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={onInsert} className="flex-1">
                      插入到光标
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      替换选中
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* 检查 tab */}
          <TabsContent value="check" className="flex-1 overflow-auto p-4 mt-0">
            <div className="space-y-3">
              <Button className="w-full">运行一致性检查</Button>
              <p className="text-sm text-muted text-center py-8">
                点击上方按钮运行检查
              </p>
            </div>
          </TabsContent>

          {/* 角色 tab */}
          <TabsContent value="characters" className="flex-1 overflow-auto p-4 mt-0">
            <p className="text-sm text-muted text-center py-8">
              本章未检测到角色
            </p>
          </TabsContent>

          {/* 透视 tab */}
          <TabsContent value="context" className="flex-1 overflow-auto p-4 mt-0">
            {contextMetadata ? (
              <pre className="text-xs whitespace-pre-wrap text-secondary">
                {JSON.stringify(contextMetadata, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted text-center py-8">
                运行 AI 工具后显示上下文数据
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Sheet>
  )
}
