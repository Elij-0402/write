import { scanCharacterNames, estimateTokens, getTokenBudget } from '@/lib/ai/context-assembler'
import type { TaskType } from '@/lib/ai/context-assembler'

describe('scanCharacterNames', () => {
  it('finds names in text', () => {
    const text = '林黛玉走进了大观园，看到了贾宝玉在亭子里读书。'
    const result = scanCharacterNames(text, ['林黛玉', '贾宝玉', '王熙凤'])
    expect(result).toContain('林黛玉')
    expect(result).toContain('贾宝玉')
    expect(result).not.toContain('王熙凤')
  })

  it('returns empty for no matches', () => {
    const text = '今天天气很好，阳光明媚。'
    const result = scanCharacterNames(text, ['林黛玉', '贾宝玉'])
    expect(result).toEqual([])
  })

  it('sorts by frequency (most frequent first)', () => {
    const text = '宝玉说了一句话。黛玉听了。宝玉又说了一句。宝玉笑了。'
    const result = scanCharacterNames(text, ['黛玉', '宝玉'])
    expect(result[0]).toBe('宝玉')
    expect(result[1]).toBe('黛玉')
  })

  it('handles short names (1-2 chars)', () => {
    const text = '云在天上飘，风吹过树梢。'
    const result = scanCharacterNames(text, ['云', '风', '雨'])
    expect(result).toContain('云')
    expect(result).toContain('风')
    expect(result).not.toContain('雨')
  })
})

describe('estimateTokens', () => {
  it('Chinese text — ~1.5 tokens per character', () => {
    const text = '你好世界' // 4 Chinese chars
    const tokens = estimateTokens(text)
    expect(tokens).toBe(6) // 4 * 1.5
  })

  it('English text — ~0.75 tokens per word', () => {
    const text = 'hello world foo bar' // 4 words
    const tokens = estimateTokens(text)
    expect(tokens).toBe(3) // ceil(4 * 0.75)
  })

  it('mixed text', () => {
    const text = '你好 world' // 2 Chinese + 1 English word
    const tokens = estimateTokens(text)
    expect(tokens).toBe(4) // ceil(2 * 1.5 + 1 * 0.75) = ceil(3.75) = 4
  })
})

describe('getTokenBudget', () => {
  const taskTypes: TaskType[] = ['write', 'rewrite', 'brainstorm', 'consistency']

  it.each(taskTypes)('allocates budget for task type: %s', (taskType) => {
    const budget = getTokenBudget(taskType)
    const total = budget.text + budget.chars + budget.world + budget.style
    // Floor rounding may lose a few tokens, but should be close to 6000
    expect(total).toBeGreaterThanOrEqual(5990)
    expect(total).toBeLessThanOrEqual(6000)
  })

  it('write task allocates 50% to text', () => {
    const budget = getTokenBudget('write')
    expect(budget.text).toBe(3000)
    expect(budget.chars).toBe(1200)
    expect(budget.world).toBe(900)
    expect(budget.style).toBe(900)
  })

  it('brainstorm task allocates 45% to worldbuilding', () => {
    const budget = getTokenBudget('brainstorm')
    expect(budget.world).toBe(2700)
  })

  it('different task types produce different text budgets', () => {
    const budgets = taskTypes.map((t) => getTokenBudget(t).text)
    const unique = new Set(budgets)
    expect(unique.size).toBe(taskTypes.length)
  })
})
