import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { buildRewritePrompt } from '@/lib/prompts/rewrite'

export async function POST(req: Request) {
  try {
    const { selectedText, characterId } = await req.json()

    if (!selectedText || selectedText.trim().length < 5) {
      return NextResponse.json({ error: '请选择要改写的文字' }, { status: 400 })
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
    const prompt = buildRewritePrompt(selectedText, characterContext)
    const result = await provider.complete(prompt, { max_tokens: 2048, temperature: 0.9 })

    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
