import type { ContextPackage } from '@/lib/ai/context-assembler'

export function buildRewritePrompt(selectedText: string, ctx: ContextPackage): string {
  let prompt = '你是一位专业的小说作家。请对以下文字进行改写，提供 2 个不同风格版本。\n'

  if (ctx.styleGuide) {
    prompt += `\n## 写作风格参考\n${ctx.styleGuide}\n`
  }

  if (ctx.characters.length > 0) {
    prompt += '\n## 当前场景涉及的角色\n'
    for (const ch of ctx.characters) {
      prompt += `【${ch.name}】性格：${ch.traits.personality || '未设定'}\n`
    }
  }

  prompt += `\n## 原文\n${selectedText}\n`
  prompt += '\n请生成 2 个改写版本，每个版本 150-300 字。保持角色性格一致。格式：\n版本1：（[风格描述]）\n[改写内容]\n\n版本2：（[风格描述]）\n[改写内容]\n\n直接输出改写结果，不要加任何说明。'
  return prompt
}
