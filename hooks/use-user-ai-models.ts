'use client'
import { useState, useCallback } from 'react'
import { fetchUserAIModels, createUserAIModel, updateUserAIModel, deleteUserAIModel, type UserAIModel } from '@/lib/ai-model-operations'

export { type UserAIModel }

export function useUserAIModels() {
  const [models, setModels] = useState<UserAIModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUserAIModels()
      setModels(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createModel = useCallback(async (model: Omit<UserAIModel, 'id' | 'user_id' | 'created_at'>) => {
    await createUserAIModel(model)
    await fetchModels()
  }, [fetchModels])

  const updateModelFn = useCallback(async (id: string, updates: Partial<UserAIModel>) => {
    await updateUserAIModel(id, updates)
    await fetchModels()
  }, [fetchModels])

  const deleteModel = useCallback(async (id: string) => {
    await deleteUserAIModel(id)
    await fetchModels()
  }, [fetchModels])

  const getDefaultModel = useCallback(() => {
    return models.find(m => m.is_default) || models[0] || null
  }, [models])

  return {
    models,
    loading,
    error,
    fetchModels,
    createModel,
    updateModel: updateModelFn,
    deleteModel,
    getDefaultModel,
  }
}
