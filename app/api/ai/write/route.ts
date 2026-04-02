import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { assembleContext } from '@/lib/ai/context-assembler'
import { buildWritePrompt } from '@/lib/prompts/write'

export async function POST(req: Request) {
  try {
    const { chapterId, cursorPosition = 0, wordCount } = await req.json()

    if (!chapterId) {
      return NextResponse.json({ error: '缺少章节 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await assembleContext(supabase, chapterId, cursorPosition, 'write')

    if (!ctx.textWindow.trim()) {
      return NextResponse.json({ error: '请先在编辑器中输入一些文字' }, { status: 400 })
    }

    const provider = getAIProvider()
    const prompt = buildWritePrompt(ctx, wordCount || 300)
    const result = await provider.complete(prompt, { max_tokens: 1024, temperature: 0.85 })

    return NextResponse.json({ result: result.trim(), metadata: ctx.metadata })
  } catch (err: any) {
    console.error('AI write error:', err)
    if (err.message?.includes('not found')) {
      return NextResponse.json({ error: '章节未找到' }, { status: 404 })
    }
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
