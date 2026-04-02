import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { assembleContext } from '@/lib/ai/context-assembler'
import { buildBrainstormPrompt } from '@/lib/prompts/brainstorm'

export async function POST(req: Request) {
  try {
    const { chapterId, topic } = await req.json()

    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: '请输入想探索的内容' }, { status: 400 })
    }

    if (chapterId) {
      const supabase = await createClient()
      const ctx = await assembleContext(supabase, chapterId, Infinity, 'brainstorm')
      const provider = getAIProvider()
      const prompt = buildBrainstormPrompt(topic, ctx)
      const result = await provider.complete(prompt, { max_tokens: 1536, temperature: 0.9 })
      return NextResponse.json({ result: result.trim(), metadata: ctx.metadata })
    }

    // Fallback: no chapter context (e.g. called from non-editor page)
    const provider = getAIProvider()
    const emptyCtx = {
      textWindow: '',
      characters: [],
      worldbuilding: [],
      styleGuide: null,
      metadata: {
        charactersMatched: [],
        worldbuildingUsed: [],
        tokenBudget: { text: 0, chars: 0, world: 0, style: 0 },
        totalTokensEstimated: 0,
        taskType: 'brainstorm' as const,
      },
    }
    const prompt = buildBrainstormPrompt(topic, emptyCtx)
    const result = await provider.complete(prompt, { max_tokens: 1536, temperature: 0.9 })
    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    console.error('AI brainstorm error:', err)
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
