import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchUserAIModels, createUserAIModel, updateUserAIModel, deleteUserAIModel } from '@/lib/ai-model-operations'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client')

const mockGetUser = vi.fn()

function makeChain(ret: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const self = {
    select: vi.fn(() => self),
    update: vi.fn(() => self),
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => self) })) })),
    delete: vi.fn(() => self),
    eq: vi.fn(() => self),
    order: vi.fn(() => self),
    ...ret,
  } as unknown as {
    select: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    insert: (() => { select: ReturnType<typeof vi.fn> }) & (() => { select: () => { single: ReturnType<typeof vi.fn> } })
    delete: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    order: ReturnType<typeof vi.fn>
  } & { data?: unknown; error?: unknown }
  return self
}

const mockFrom = vi.fn(() => makeChain())

vi.mocked(createClient).mockResolvedValue({
  auth: { getUser: mockGetUser },
  from: mockFrom,
} as ReturnType<typeof createClient>)

const mockUser = { id: 'user-123' }
const mockModel = {
  id: 'model-1',
  user_id: 'user-123',
  name: 'DeepSeek',
  base_url: 'https://api.deepseek.com',
  api_key: 'sk-test',
  model_name: 'deepseek-chat',
  is_default: true,
  created_at: '2026-01-01',
}

function resetChain(ret = { data: null, error: null }) {
  const c = makeChain(ret)
  mockFrom.mockReturnValue(c)
  return c
}

describe('ai-model-operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    resetChain()
  })

  describe('fetchUserAIModels', () => {
    it('returns models for authenticated user', async () => {
      resetChain({ data: [mockModel], error: null })

      const result = await fetchUserAIModels()
      expect(result).toEqual([mockModel])
    })

    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await expect(fetchUserAIModels()).rejects.toThrow('Unauthorized')
    })

    it('returns empty array when no models found', async () => {
      resetChain({ data: null, error: null })

      const result = await fetchUserAIModels()
      expect(result).toEqual([])
    })

    it('throws on query error', async () => {
      resetChain({ data: null, error: { message: 'DB error' } })

      await expect(fetchUserAIModels()).rejects.toThrow('DB error')
    })
  })

  describe('createUserAIModel', () => {
    it('unsets other defaults when is_default=true', async () => {
      const c = resetChain({ data: mockModel, error: null })
      c.update.mockReturnValueOnce(c)

      await createUserAIModel({ name: 'DeepSeek', base_url: 'https://api.deepseek.com', api_key: 'sk-test', model_name: 'deepseek-chat', is_default: true })

      expect(c.update).toHaveBeenCalledWith({ is_default: false })
      expect(c.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await expect(createUserAIModel({ name: 'Test', base_url: 'url', api_key: 'key', model_name: 'm', is_default: false })).rejects.toThrow('Unauthorized')
    })

    it('throws on insert error', async () => {
      const c = resetChain({ data: null, error: { message: 'Insert failed' } })
      c.update.mockReturnValueOnce(c)

      await expect(createUserAIModel({ name: 'Test', base_url: 'url', api_key: 'key', model_name: 'm', is_default: false })).rejects.toThrow('Insert failed')
    })
  })

  describe('updateUserAIModel', () => {
    it('unsets other defaults when is_default=true', async () => {
      const c = resetChain()
      c.update.mockReturnValueOnce(c)

      await updateUserAIModel('model-1', { is_default: true })

      expect(c.update).toHaveBeenCalledWith({ is_default: false })
      expect(c.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await expect(updateUserAIModel('model-1', { name: 'New' })).rejects.toThrow('Unauthorized')
    })

    it('throws on update error', async () => {
      const c = makeChain({ data: null, error: { message: 'Update failed' } })
      c.update.mockReturnValueOnce(c)
      mockFrom.mockReturnValue(c)

      await expect(updateUserAIModel('model-1', { name: 'New' })).rejects.toThrow('Update failed')
    })
  })

  describe('deleteUserAIModel', () => {
    it('deletes the model', async () => {
      const c = makeChain({ data: [{ id: 'model-1', is_default: false }], error: null })
      c.delete.mockReturnValueOnce(c)
      mockFrom.mockReturnValue(c)

      await deleteUserAIModel('model-1')
      expect(c.delete).toHaveBeenCalled()
    })

    it('promotes first remaining model when deleting default', async () => {
      const c = makeChain({ data: [{ id: 'model-1', is_default: true }, { id: 'model-2', is_default: false }], error: null })
      c.update.mockReturnValueOnce(c)
      c.delete.mockReturnValueOnce(c)
      mockFrom.mockReturnValue(c)

      await deleteUserAIModel('model-1')

      expect(c.update).toHaveBeenCalledWith({ is_default: true })
    })

    it('does not promote if deleting non-default model', async () => {
      const c = makeChain({ data: [{ id: 'model-2', is_default: false }], error: null })
      c.delete.mockReturnValueOnce(c)
      mockFrom.mockReturnValue(c)

      await deleteUserAIModel('model-2')

      expect(c.update).not.toHaveBeenCalled()
    })

    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await expect(deleteUserAIModel('model-1')).rejects.toThrow('Unauthorized')
    })
  })
})
