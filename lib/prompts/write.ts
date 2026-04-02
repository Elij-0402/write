export function buildWritePrompt(context: string, wordCount = 300): string {
  return `你是一位专业的小说作家。请根据以下文风续写故事。

上下文（仅用于风格参考，不要重复）：
${context}

请续写 200-${wordCount} 字。直接输出续写内容，不要加任何前缀说明。`
}
