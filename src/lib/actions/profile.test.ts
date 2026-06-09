import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateProfile } from './profile'

const mockRequireSession = vi.mocked(requireSession)
const mockUpdate = vi.mocked(db.user.update)
const mockRevalidatePath = vi.mocked(revalidatePath)

function profileForm(displayName: string) {
  const formData = new FormData()
  formData.set('displayName', displayName)
  return formData
}

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
    mockUpdate.mockResolvedValue({})
  })

  it('returns a validation error without writing for blank display names', async () => {
    const result = await updateProfile(profileForm(''))

    expect(result).toEqual({ error: 'Display name is required' })
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('updates the current user display name', async () => {
    const result = await updateProfile(profileForm('Hags'))

    expect(result).toEqual({ ok: true })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { displayName: 'Hags' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/profile')
  })
})
