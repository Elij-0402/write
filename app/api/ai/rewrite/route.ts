import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { buildRewritePrompt } from '@/lib/prompts/rewrite'

export async function POST(req: Request) {
  try {
    const { selectedText } = await req.json()

    if (!selectedText || selectedText.trim().length < 5) {
      return NextResponse.json({ error: '请选择要改写的文字' }, { status: 400 })
    }

    const provider = getAIProvider()
    const prompt = buildRewritePrompt(selectedText)
    const result = await provider.complete(prompt, { max_tokens: 2048, temperature: 0.9 })

    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
