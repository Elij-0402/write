export function buildRewritePrompt(
  selectedText: string,
  characterContext?: string
): string {
  let prompt = `你是一位专业的小说作家。请对以下文字进行改写，提供 2 个不同风格版本。`

  if (characterContext) {
    prompt += `\n\n当前场景涉及的角色设定：\n${characterContext}`
  }

  prompt += `\n\n原文：
${selectedText}\n\n请生成 2 个改写版本，每个版本 150-300 字。格式：
版本1：（[风格描述]）
[改写内容]\n\n版本2：（[风格描述]）
[改写内容]\n\n直接输出改写结果，不要加任何说明。`
  return prompt
}
