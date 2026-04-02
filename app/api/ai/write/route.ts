import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { buildWritePrompt } from '@/lib/prompts/write'

export async function POST(req: Request) {
  try {
    const { context, wordCount, characterId } = await req.json()

    if (!context || context.trim().length < 10) {
      return NextResponse.json({ error: '上下文内容不足' }, { status: 400 })
    }

    let characterContext: string | undefined
    if (characterId) {
      const supabase = await createClient()
      const { data: ch } = await supabase
        .from('characters')
        .select('name, traits')
        .eq('id', characterId)
        .single()

      if (ch) {
        characterContext = `【${ch.name}】\n` +
          `外貌：${ch.traits?.appearance || '未设定'}\n` +
          `性格：${ch.traits?.personality || '未设定'}\n` +
          `背景：${ch.traits?.background || '未设定'}\n` +
          `动机：${ch.traits?.motivation || '未设定'}\n` +
          `关系：${ch.traits?.relationships || '未设定'}`
      }
    }

    const provider = getAIProvider()
    const prompt = buildWritePrompt(context, wordCount || 300, characterContext)
    const result = await provider.complete(prompt, { max_tokens: 1024, temperature: 0.85 })

    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    console.error('AI write error:', err)
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
