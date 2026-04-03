import { createAIProvider } from '../factory'

describe('createAIProvider', () => {
  it('creates a provider with correct config', () => {
    const provider = createAIProvider({
      base_url: 'https://api.test.com',
      api_key: 'test-key',
      model_name: 'test-model',
    })
    expect(provider).toBeDefined()
    expect(typeof provider.complete).toBe('function')
  })
})
