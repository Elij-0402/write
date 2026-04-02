import { SupabaseClient } from '@supabase/supabase-js'
import { extractTextFromJson } from '@/lib/utils/tiptap'
import type { CharacterTraits } from '@/types/database'

export type TaskType = 'write' | 'rewrite' | 'brainstorm' | 'consistency'

export interface ContextPackage {
  textWindow: string
  characters: { name: string; traits: CharacterTraits }[]
  worldbuilding: { title: string; content: string; category: string }[]
  styleGuide: string | null
  metadata: ContextMetadata
}

export interface ContextMetadata {
  charactersMatched: string[]
  worldbuildingUsed: string[]
  tokenBudget: { text: number; chars: number; world: number; style: number }
  totalTokensEstimated: number
  taskType: TaskType
}

const TOTAL_TOKEN_BUDGET = 6000

const BUDGET_RATIOS: Record<TaskType, { text: number; chars: number; world: number; style: number }> = {
  write:       { text: 0.50, chars: 0.20, world: 0.15, style: 0.15 },
  rewrite:     { text: 0.30, chars: 0.30, world: 0.15, style: 0.25 },
  brainstorm:  { text: 0.20, chars: 0.20, world: 0.45, style: 0.15 },
  consistency: { text: 0.40, chars: 0.30, world: 0.20, style: 0.10 },
}

export function getTokenBudget(taskType: TaskType) {
  const ratios = BUDGET_RATIOS[taskType]
  return {
    text:  Math.floor(TOTAL_TOKEN_BUDGET * ratios.text),
    chars: Math.floor(TOTAL_TOKEN_BUDGET * ratios.chars),
    world: Math.floor(TOTAL_TOKEN_BUDGET * ratios.world),
    style: Math.floor(TOTAL_TOKEN_BUDGET * ratios.style),
  }
}

export function estimateTokens(text: string): number {
  if (!text) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  const nonChinese = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ').trim()
  const englishWords = nonChinese ? nonChinese.split(/\s+/).filter(Boolean).length : 0
  return Math.ceil(chineseChars * 1.5 + englishWords * 0.75)
}

export function scanCharacterNames(text: string, characterNames: string[]): string[] {
  if (!text || characterNames.length === 0) return []

  const freq = new Map<string, number>()
  for (const name of characterNames) {
    if (!name) continue
    const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    const matches = text.match(regex)
    if (matches && matches.length > 0) {
      freq.set(name, matches.length)
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
}

function truncateToTokenBudget(text: string, tokenBudget: number): string {
  if (!text) return ''
  const approxChars = Math.floor(tokenBudget / 1.5)
  if (text.length <= approxChars) return text
  return text.slice(-approxChars)
}

export async function assembleContext(
  supabase: SupabaseClient,
  chapterId: string,
  cursorPosition: number,
  taskType: TaskType,
): Promise<ContextPackage> {
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('content, project_id')
    .eq('id', chapterId)
    .single()

  if (chapterError || !chapter) {
    throw new Error(`Chapter not found: ${chapterId}`)
  }

  const projectId = chapter.project_id
  const fullText = extractTextFromJson(
    typeof chapter.content === 'string' ? chapter.content : JSON.stringify(chapter.content),
  )

  const budget = getTokenBudget(taskType)
  const textWindow = truncateToTokenBudget(
    fullText.slice(0, cursorPosition),
    budget.text,
  )

  const [charactersResult, worldbuildingResult, projectResult] = await Promise.all([
    supabase.from('characters').select('name, traits').eq('project_id', projectId).then(
      (r) => r,
      () => ({ data: null, error: { message: 'failed' } }),
    ),
    supabase.from('worldbuilding').select('title, content, category').eq('project_id', projectId).then(
      (r) => r,
      () => ({ data: null, error: { message: 'failed' } }),
    ),
    supabase.from('projects').select('style_guide').eq('id', projectId).single().then(
      (r) => r,
      () => ({ data: null, error: { message: 'failed' } }),
    ),
  ])

  const allCharacters = (charactersResult.data ?? []) as { name: string; traits: CharacterTraits }[]
  const allWorldbuilding = (worldbuildingResult.data ?? []) as { title: string; content: string; category: string }[]
  const styleGuide = (projectResult.data as { style_guide: string | null } | null)?.style_guide ?? null

  const characterNames = allCharacters.map((c) => c.name)
  const matchedNames = scanCharacterNames(textWindow, characterNames)
  const matchedCharacters = matchedNames
    .map((name) => allCharacters.find((c) => c.name === name))
    .filter((c): c is { name: string; traits: CharacterTraits } => c !== undefined)

  const matchedWorldbuilding = allWorldbuilding.filter((entry) =>
    textWindow.includes(entry.title),
  )

  const totalTokensEstimated =
    estimateTokens(textWindow) +
    estimateTokens(matchedCharacters.map((c) => JSON.stringify(c.traits)).join('')) +
    estimateTokens(matchedWorldbuilding.map((w) => w.content).join('')) +
    estimateTokens(styleGuide ?? '')

  return {
    textWindow,
    characters: matchedCharacters,
    worldbuilding: matchedWorldbuilding,
    styleGuide,
    metadata: {
      charactersMatched: matchedNames,
      worldbuildingUsed: matchedWorldbuilding.map((w) => w.title),
      tokenBudget: budget,
      totalTokensEstimated,
      taskType,
    },
  }
}
