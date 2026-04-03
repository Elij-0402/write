import { createClient } from '@/lib/supabase/server'
import { createAIProvider } from './factory'

export async function getUserAIModel() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('user_ai_models')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    const { data: fallback } = await supabase
      .from('user_ai_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!fallback) throw new Error('未配置 AI 模型，请先在设置中添加')
    return fallback
  }

  return data
}

export async function getUserAIProvider() {
  const model = await getUserAIModel()
  return createAIProvider({
    base_url: model.base_url,
    api_key: model.api_key,
    model_name: model.model_name,
  })
}
