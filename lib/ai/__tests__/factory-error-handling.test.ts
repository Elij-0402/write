import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAIProvider } from '../factory'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

describe('createAIProvider error handling', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('throws when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    const provider = createAIProvider({
      base_url: 'https://api.test.com',
      api_key: 'test-key',
      model_name: 'test-model',
    })

    await expect(provider.complete('prompt')).rejects.toThrow('API error: 401')
  })

  it('throws when network error occurs', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network failure'))

    const provider = createAIProvider({
      base_url: 'https://api.test.com',
      api_key: 'test-key',
      model_name: 'test-model',
    })

    await expect(provider.complete('prompt')).rejects.toThrow('Network failure')
  })

  it('throws when choices is missing from response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'test' }),
    })

    const provider = createAIProvider({
      base_url: 'https://api.test.com',
      api_key: 'test-key',
      model_name: 'test-model',
    })

    await expect(provider.complete('prompt')).rejects.toThrow()
  })

  it('returns content from choices on success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Hello world' } }],
      }),
    })

    const provider = createAIProvider({
      base_url: 'https://api.test.com',
      api_key: 'test-key',
      model_name: 'test-model',
    })

    const result = await provider.complete('prompt')
    expect(result).toBe('Hello world')
  })

  it('passes custom max_tokens and temperature to API', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'result' } }],
      }),
    })

    const provider = createAIProvider({
      base_url: 'https://api.test.com',
      api_key: 'test-key',
      model_name: 'test-model',
    })

    await provider.complete('prompt', { max_tokens: 500, temperature: 0.5 })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'test-model',
          messages: [{ role: 'user', content: 'prompt' }],
          max_tokens: 500,
          temperature: 0.5,
        }),
      })
    )
  })
})
