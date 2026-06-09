import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTitleAvailability } from './useTitleAvailability'

const mockFetch = vi.fn<typeof fetch>()

describe('useTitleAvailability', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('does not fetch for titles shorter than 3 characters', () => {
    const { result } = renderHook(() => useTitleAvailability('ab'))

    expect(result.current).toEqual({ taken: null, checking: false })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sets checking while waiting for the debounce', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ taken: false }),
    } as Response)

    const { result } = renderHook(() => useTitleAvailability('Lemon Pasta'))

    expect(result.current).toEqual({ taken: null, checking: true })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches after 500ms and updates taken state', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ taken: true }),
    } as Response)

    const { result } = renderHook(() => useTitleAvailability('Lemon Pasta'))

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(result.current).toEqual({ taken: true, checking: false })
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/recipes/check-title?title=Lemon+Pasta')
  })

  it('passes excludeId as a query parameter', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ taken: false }),
    } as Response)

    renderHook(() => useTitleAvailability('Lemon Pasta', 'recipe-1'))

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/recipes/check-title?title=Lemon+Pasta&excludeId=recipe-1',
    )
  })

  it('debounces title changes and only checks the latest title', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ taken: false }),
    } as Response)

    const { rerender } = renderHook(({ title }) => useTitleAvailability(title), {
      initialProps: { title: 'Lemon' },
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })
    rerender({ title: 'Lemon Pasta' })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/recipes/check-title?title=Lemon+Pasta')
  })

  it('leaves taken unchanged and clears checking on non-OK responses', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ taken: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ taken: false }),
      } as Response)

    const { result, rerender } = renderHook(({ title }) => useTitleAvailability(title), {
      initialProps: { title: 'Lemon Pasta' },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    await waitFor(() => {
      expect(result.current).toEqual({ taken: true, checking: false })
    })

    rerender({ title: 'Orange Pasta' })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(result.current).toEqual({ taken: true, checking: false })
    })
  })
})
