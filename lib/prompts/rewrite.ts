export function buildRewritePrompt(selectedText: string): string {
  return `你是一位专业的小说作家。请对以下文字进行改写，提供 2 个不同风格版本。

原文：
${selectedText}

请生成 2 个改写版本，每个版本 150-300 字。格式：
版本1：（[风格描述]）
[改写内容]

版本2：（[风格描述]）
[改写内容]

直接输出改写结果，不要加任何说明。`
}
