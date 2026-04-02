import type { ContextPackage } from '@/lib/ai/context-assembler'

export function buildConsistencyPrompt(ctx: ContextPackage): string {
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
  return prompt
}
