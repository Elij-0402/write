import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { buildBrainstormPrompt } from '@/lib/prompts/brainstorm'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()

    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: '请输入想探索的内容' }, { status: 400 })
    }

    const provider = getAIProvider()
    const prompt = buildBrainstormPrompt(topic)
    const result = await provider.complete(prompt, { max_tokens: 1536, temperature: 0.9 })

    return NextResponse.json({ result: result.trim() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI 生成失败' }, { status: 500 })
  }
}
