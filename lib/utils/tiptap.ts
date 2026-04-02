export function extractTextFromJson(jsonStr: string): string {
  try {
    const doc = JSON.parse(jsonStr)
    return getTextFromNode(doc)
  } catch {
    return ''
  }
}

function getTextFromNode(node: any): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (node.content) return node.content.map(getTextFromNode).join('')
  return ''
}

export function countChineseWords(text: string): number {
  if (!text || !text.trim()) return 0
  // Count Chinese characters individually, English words by whitespace
  const chinese = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)?.length ?? 0
  const english = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return chinese + english
}
