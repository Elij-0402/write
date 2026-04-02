export function buildBrainstormPrompt(topic: string): string {
  return `你是一位创意写作教练。用户正在创作小说，遇到以下问题/想探索：

"${topic}"

请提供 3-5 个创意方向或解决思路，每个 50-100 字。
用编号列表格式输出，直接给内容，不需要"以下是..."之类的引导语。`
}
