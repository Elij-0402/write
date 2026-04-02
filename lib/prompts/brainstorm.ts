import type { ContextPackage } from '@/lib/ai/context-assembler'

export function buildBrainstormPrompt(topic: string, ctx: ContextPackage): string {
  let prompt = '你是一位创意写作教练。用户正在创作小说，遇到以下问题/想探索：\n'
  prompt += `\n"${topic}"\n`

  if (ctx.worldbuilding.length > 0) {
    prompt += '\n## 世界观背景\n'
    for (const w of ctx.worldbuilding) {
      prompt += `- ${w.title}：${w.content}\n`
    }
  }

  if (ctx.characters.length > 0) {
    prompt += '\n## 相关角色\n'
    for (const ch of ctx.characters) {
      prompt += `- ${ch.name}（${ch.traits.personality || '未设定'}）\n`
    }
  }

  prompt += '\n请基于以上世界观和角色，提供 3-5 个创意方向或解决思路，每个 50-100 字。\n用编号列表格式输出，直接给内容。'
  return prompt
}
