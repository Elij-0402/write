import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 小说工作台',
  description: '沉浸式 AI 小说写作工具',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
