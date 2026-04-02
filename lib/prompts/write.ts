import type { ContextPackage } from '@/lib/ai/context-assembler'

export function buildWritePrompt(ctx: ContextPackage, wordCount = 300): string {
  let prompt = '你是一位专业的小说作家。请根据以下设定和文风续写故事。\n'

  if (ctx.styleGuide) {
    prompt += `\n## 写作风格\n${ctx.styleGuide}\n`
  }

  if (ctx.characters.length > 0) {
    prompt += '\n## 当前场景涉及的角色\n'
    for (const ch of ctx.characters) {
      prompt += `\n【${ch.name}】\n`
      if (ch.traits.personality) prompt += `性格：${ch.traits.personality}\n`
      if (ch.traits.background) prompt += `背景：${ch.traits.background}\n`
      if (ch.traits.motivation) prompt += `动机：${ch.traits.motivation}\n`
      if (ch.traits.relationships) prompt += `关系：${ch.traits.relationships}\n`
    }
  }

  if (ctx.worldbuilding.length > 0) {
    prompt += '\n## 相关世界观设定\n'
    for (const w of ctx.worldbuilding) {
      prompt += `- ${w.title}：${w.content}\n`
    }
  }

  prompt += `\n## 上下文（仅用于风格参考，不要重复）\n${ctx.textWindow}\n`
  prompt += `\n请续写 200-${wordCount} 字。保持角色性格和世界观一致。直接输出续写内容，不要加任何前缀说明。`
  return prompt
}
