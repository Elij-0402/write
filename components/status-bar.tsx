interface StatusBarProps {
  wordCount: number
  chapterTitle: string
  saveStatus: 'saved' | 'saving' | 'unsaved'
}

export function StatusBar({ wordCount, chapterTitle, saveStatus }: StatusBarProps) {
  return (
    <footer className="h-8 border-t flex items-center px-4 text-xs text-muted-foreground shrink-0">
      <span>{chapterTitle || '未命名章节'}</span>
      <span className="mx-2">·</span>
      <span>{wordCount.toLocaleString()} 字</span>
      <div className="flex-1" />
      <span className={
        saveStatus === 'saved' ? 'text-success' :
        saveStatus === 'saving' ? 'text-warning' : 'text-error'
      }>
        {saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '未保存'}
      </span>
    </footer>
  )
}
