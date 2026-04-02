import type { AIProvider } from './provider'

export class DeepSeekProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'deepseek-chat') {
    this.apiKey = apiKey
    this.model = model
  }

  async complete(prompt: string, options?: { max_tokens?: number; temperature?: number }): Promise<string> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.max_tokens ?? 1024,
        temperature: options?.temperature ?? 0.8,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    return data.choices[0].message.content as string
  }
}

// 单例
let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!_provider) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set')
    _provider = new DeepSeekProvider(apiKey)
  }
  return _provider
}
