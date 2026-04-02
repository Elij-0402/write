export interface AIProvider {
  complete(prompt: string, options?: { max_tokens?: number; temperature?: number }): Promise<string>
}

export interface WriteOptions {
  context: string
  genre?: string
  wordCount?: number
}
