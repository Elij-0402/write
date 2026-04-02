import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { assembleContext } from '@/lib/ai/context-assembler'
import { buildConsistencyPrompt } from '@/lib/prompts/consistency'

export async function POST(req: Request) {
  try {
    const { chapterId } = await req.json()

    if (!chapterId) {
      return NextResponse.json({ error: '缺少章节 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await assembleContext(supabase, chapterId, Infinity, 'consistency')

    if (ctx.textWindow.length < 100) {
      return NextResponse.json({ error: '章节内容太少，无法进行有意义的一致性检查（至少需要 100 字）' }, { status: 400 })
    }

    if (ctx.characters.length === 0) {
      return NextResponse.json({ error: '没有角色卡数据。请先创建角色卡，一致性检查需要对照角色设定来发现冲突。' }, { status: 400 })
    }

    const prompt = buildConsistencyPrompt(ctx)

    const provider = getAIProvider()
    const raw = await provider.complete(prompt, { max_tokens: 2048, temperature: 0.3 })

    let conflicts = []
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) {
        conflicts = []
      } else {
        const validTypes = ['character', 'timeline', 'address', 'worldbuilding']
        const validSeverities = ['high', 'medium', 'low']
        conflicts = parsed.filter((item: any) =>
          item &&
          typeof item.type === 'string' && validTypes.includes(item.type) &&
          typeof item.severity === 'string' && validSeverities.includes(item.severity) &&
          typeof item.description === 'string' && item.description.length > 0
        )
      }
    } catch {
      console.error('Failed to parse AI consistency response:', raw.slice(0, 500))
      return NextResponse.json({
        error: 'AI 返回了无法解析的结果，请重试',
      }, { status: 422 })
    }

    return NextResponse.json({ conflicts, metadata: ctx.metadata })
  } catch (err: any) {
    console.error('Consistency check error:', err)
    const msg = err.message || 'AI 生成失败'
    if (msg.includes('429') || msg.includes('rate')) {
      return NextResponse.json({ error: 'AI 服务繁忙，请稍后重试' }, { status: 429 })
    }
    if (msg.includes('timeout') || msg.includes('Timeout')) {
      return NextResponse.json({ error: 'AI 响应超时，请重试' }, { status: 504 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
