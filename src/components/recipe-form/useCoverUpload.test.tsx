import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChangeEvent } from 'react'
import { uploadBytes } from 'firebase/storage'
import { useCoverUpload } from './useCoverUpload'

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}))

vi.mock('@/lib/firebase-client', () => ({
  auth: {
    app: {},
    currentUser: { uid: 'user-1' },
  },
}))

vi.mock('@/lib/monitoring/errors', () => ({
  captureException: vi.fn(),
}))

function fileChangeEvent(file: File): ChangeEvent<HTMLInputElement> {
  return {
    target: {
      files: [file],
      value: 'cover.jpg',
    },
  } as unknown as ChangeEvent<HTMLInputElement>
}

describe('useCoverUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects cover images larger than 5MB before uploading', async () => {
    const setValue = vi.fn()
    const file = new File(['x'], 'cover.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 })
    const event = fileChangeEvent(file)

    const { result } = renderHook(() => useCoverUpload(setValue))

    await act(async () => {
      await result.current.handleCoverUpload(event)
    })

    expect(uploadBytes).not.toHaveBeenCalled()
    expect(setValue).not.toHaveBeenCalled()
    expect(result.current.uploadError).toBe('Cover image must be 5MB or smaller.')
    expect(event.target.value).toBe('')
  })
})
