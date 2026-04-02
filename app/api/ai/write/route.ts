import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { buildWritePrompt } from '@/lib/prompts/write'

export async function POST(req: Request) {
  try {
    const { context, wordCount } = await req.json()

    if (!context || context.trim().length < 10) {
      return NextResponse.json({ error: '上下文内容不足' }, { status: 400 })
    }

    const provider = getAIProvider()
    const prompt = buildWritePrompt(context, wordCount || 300)
    const result = await provider.complete(prompt, { max_tokens: 1024, temperature: 0.85 })

    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    console.error('AI write error:', err)
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
