import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { assembleContext } from '@/lib/ai/context-assembler'
import { buildRewritePrompt } from '@/lib/prompts/rewrite'

export async function POST(req: Request) {
  try {
    const { chapterId, selectedText, cursorPosition = 0 } = await req.json()

    if (!selectedText || selectedText.trim().length < 5) {
      return NextResponse.json({ error: '请选择要改写的文字（至少 5 个字）' }, { status: 400 })
    }

    if (!chapterId) {
      return NextResponse.json({ error: '缺少章节 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const ctx = await assembleContext(supabase, chapterId, cursorPosition, 'rewrite')

    const provider = getAIProvider()
    const prompt = buildRewritePrompt(selectedText, ctx)
    const result = await provider.complete(prompt, { max_tokens: 2048, temperature: 0.9 })

    return NextResponse.json({ result: result.trim(), metadata: ctx.metadata })
  } catch (err: any) {
    console.error('AI rewrite error:', err)
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
