import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai/deepseek'
import { assembleContext } from '@/lib/ai/context-assembler'

export async function POST(req: Request) {
  try {
    const { chapterId } = await req.json()

    if (!chapterId) {
      return NextResponse.json({ error: '缺少章节 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const ctx = await assembleContext(supabase, chapterId, Infinity, 'consistency')

    if (ctx.textWindow.length < 100) {
      return NextResponse.json({ error: '章节内容太少，无法进行有意义的一致性检查（至少需要 100 字）' }, { status: 400 })
    }

    if (ctx.characters.length === 0) {
      return NextResponse.json({ error: '没有角色卡数据。请先创建角色卡，一致性检查需要对照角色设定来发现冲突。' }, { status: 400 })
    }

    let prompt = '你是一位专业的小说编辑。请仔细检查以下章节内容，对照角色设定和世界观，找出设定冲突。\n'
    prompt += '\n## 角色设定\n'
    for (const ch of ctx.characters) {
      prompt += `\n【${ch.name}】\n`
      if (ch.traits.appearance) prompt += `外貌：${ch.traits.appearance}\n`
      if (ch.traits.personality) prompt += `性格：${ch.traits.personality}\n`
      if (ch.traits.background) prompt += `背景：${ch.traits.background}\n`
      if (ch.traits.motivation) prompt += `动机：${ch.traits.motivation}\n`
      if (ch.traits.relationships) prompt += `关系：${ch.traits.relationships}\n`
    }

    if (ctx.worldbuilding.length > 0) {
      prompt += '\n## 世界观设定\n'
      for (const w of ctx.worldbuilding) {
        prompt += `- ${w.title}：${w.content}\n`
      }
    }

    prompt += `\n## 章节内容\n${ctx.textWindow}\n`
    prompt += `\n请以 JSON 数组格式返回发现的冲突。每个冲突包含：
{
  "type": "character" | "timeline" | "address" | "worldbuilding",
  "severity": "high" | "medium" | "low",
  "description": "冲突描述",
  "quote": "原文引用",
  "reference": "对应的设定内容",
  "suggestion": "修改建议"
}

如果没有发现冲突，返回空数组 []。
只输出 JSON，不要加任何其他文字。`

    const provider = getAIProvider()
    const raw = await provider.complete(prompt, { max_tokens: 2048, temperature: 0.3 })

    let conflicts = []
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      conflicts = JSON.parse(cleaned)
      if (!Array.isArray(conflicts)) conflicts = []
    } catch {
      return NextResponse.json({
        error: 'AI 返回了无法解析的结果，请重试',
        raw: raw.slice(0, 200),
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
