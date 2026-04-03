import type { AIProvider } from './provider'

export interface AIProviderConfig {
  base_url: string
  api_key: string
  model_name: string
}

export function createAIProvider(config: AIProviderConfig): AIProvider {
  return {
    async complete(prompt, options) {
      const res = await fetch(`${config.base_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`,
        },
        body: JSON.stringify({
          model: config.model_name,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.max_tokens ?? 1024,
          temperature: options?.temperature ?? 0.8,
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      return data.choices[0].message.content as string
    },
  }
}
