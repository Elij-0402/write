export function buildWritePrompt(
  context: string,
  wordCount = 300,
  characterContext?: string
): string {
  let prompt = `你是一位专业的小说作家。请根据以下文风续写故事。`

  if (characterContext) {
    prompt += `\n\n当前场景涉及的角色设定：\n${characterContext}`
  }

  prompt += `\n\n上下文（仅用于风格参考，不要重复）：
${context}\n\n请续写 200-${wordCount} 字。直接输出续写内容，不要加任何前缀说明。`
  return prompt
}
