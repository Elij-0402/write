'use client'
import { useState, useCallback } from 'react'
import { TopBar } from '@/components/top-bar'
import { SidePanel } from '@/components/side-panel'
import { useSupabase } from '@/components/providers'
import { Providers } from '@/components/providers'

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { loading } = useSupabase()
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTool, setActiveTool] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [brainstormInput, setBrainstormInput] = useState('')

  const handleToolClick = useCallback((tool: string) => {
    setActiveTool(tool)
    setPanelOpen(true)
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar onToolClick={handleToolClick} onProjectToolClick={() => {}} onMenuClick={() => {}} />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={activeTool === 'write' ? '续写结果' : activeTool === 'rewrite' ? '改写结果' : '头脑风暴'}
        loading={aiLoading}
        error={aiError}
        value={aiContent}
        onChange={setAiContent}
        onInsert={() => {}}
        mode={activeTool as any}
        brainstormInput={brainstormInput}
        onBrainstormInputChange={setBrainstormInput}
        onBrainstormSubmit={() => {}}
      />
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Providers>
  )
}
