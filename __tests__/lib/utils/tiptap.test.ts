import { extractTextFromJson, countChineseWords } from '@/lib/utils/tiptap'

describe('extractTextFromJson', () => {
  it('valid Tiptap JSON → text', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '你好世界' }],
        },
      ],
    })
    expect(extractTextFromJson(json)).toBe('你好世界')
  })

  it('empty JSON → empty string', () => {
    const json = JSON.stringify({ type: 'doc', content: [] })
    expect(extractTextFromJson(json)).toBe('')
  })

  it('invalid JSON → empty string', () => {
    expect(extractTextFromJson('not valid json {')).toBe('')
  })

  it('nested content nodes', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '第一段' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '第二段' },
          ],
        },
      ],
    })
    expect(extractTextFromJson(json)).toBe('第一段第二段')
  })
})

describe('countChineseWords', () => {
  it('pure Chinese text', () => {
    expect(countChineseWords('你好世界')).toBe(4)
  })

  it('pure English text', () => {
    expect(countChineseWords('hello world')).toBe(2)
  })

  it('mixed Chinese+English', () => {
    // 2 Chinese chars + 1 English word
    expect(countChineseWords('你好 world')).toBe(3)
  })

  it('empty string → 0', () => {
    expect(countChineseWords('')).toBe(0)
  })
})
