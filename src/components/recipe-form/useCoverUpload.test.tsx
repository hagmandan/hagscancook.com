import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChangeEvent } from 'react'
import { uploadBytes, getDownloadURL } from 'firebase/storage'
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

  it('rejects non-image files before uploading', async () => {
    const setValue = vi.fn()
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
    const event = fileChangeEvent(file)

    const { result } = renderHook(() => useCoverUpload(setValue))

    await act(async () => {
      await result.current.handleCoverUpload(event)
    })

    expect(uploadBytes).not.toHaveBeenCalled()
    expect(setValue).not.toHaveBeenCalled()
    expect(result.current.uploadError).toBe('Please choose a JPEG, PNG, WebP, or GIF image.')
    expect(event.target.value).toBe('')
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

  it('uploads successfully and calls setValue with the download URL', async () => {
    const setValue = vi.fn()
    const file = new File(['data'], 'cover.png', { type: 'image/png' })
    const event = fileChangeEvent(file)
    const mockUrl = 'https://storage.example.com/covers/user-1/cover.png'

    vi.mocked(uploadBytes).mockResolvedValueOnce({} as never)
    vi.mocked(getDownloadURL).mockResolvedValueOnce(mockUrl)

    const { result } = renderHook(() => useCoverUpload(setValue))

    await act(async () => {
      await result.current.handleCoverUpload(event)
    })

    expect(uploadBytes).toHaveBeenCalled()
    expect(setValue).toHaveBeenCalledWith('coverImageUrl', mockUrl, { shouldDirty: true })
    expect(result.current.uploadError).toBeNull()
    expect(result.current.isUploading).toBe(false)
  })

  it('shows error and clears uploading state when Firebase upload fails', async () => {
    const setValue = vi.fn()
    const file = new File(['data'], 'cover.jpg', { type: 'image/jpeg' })
    const event = fileChangeEvent(file)

    vi.mocked(uploadBytes).mockRejectedValueOnce(new Error('storage/unauthorized'))

    const { result } = renderHook(() => useCoverUpload(setValue))

    await act(async () => {
      await result.current.handleCoverUpload(event)
    })

    expect(setValue).not.toHaveBeenCalled()
    expect(result.current.uploadError).toBe('Upload failed. Please try again.')
    expect(result.current.isUploading).toBe(false)
  })
})
