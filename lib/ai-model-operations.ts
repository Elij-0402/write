import { createClient } from '@/lib/supabase/client'

export interface UserAIModel {
  id: string
  user_id: string
  name: string
  base_url: string
  api_key: string
  model_name: string
  is_default: boolean
  created_at: string
}

export async function fetchUserAIModels(): Promise<UserAIModel[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('user_ai_models')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createUserAIModel(model: Omit<UserAIModel, 'id' | 'user_id' | 'created_at'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (model.is_default) {
    await supabase.from('user_ai_models')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('user_ai_models')
    .insert({ ...model, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateUserAIModel(id: string, updates: Partial<UserAIModel>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (updates.is_default) {
    await supabase.from('user_ai_models')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { error } = await supabase
    .from('user_ai_models')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function deleteUserAIModel(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: models } = await supabase
    .from('user_ai_models')
    .select('id, is_default')
    .eq('user_id', user.id)

  const modelToDelete = models?.find(m => m.id === id)
  const wasDefault = modelToDelete?.is_default

  const { error } = await supabase
    .from('user_ai_models')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  if (wasDefault && models && models.length > 1) {
    const remaining = models.filter(m => m.id !== id)
    if (remaining.length > 0) {
      await supabase.from('user_ai_models')
        .update({ is_default: true })
        .eq('id', remaining[0].id)
    }
  }
}
