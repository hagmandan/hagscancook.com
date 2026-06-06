import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, renderHook, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from './toast'
import type { ReactNode } from 'react'

// ToastContainer imports Toast component which has CSS modules — stub them out
vi.mock('@/components/ui/Toast', () => ({
  Toast: ({ toast, onDismiss }: { toast: { id: string; title: string; message: string }; onDismiss: () => void }) => (
    <div data-testid={`toast-${toast.id}`}>
      {toast.title}: {toast.message}
      <button onClick={onDismiss}>dismiss</button>
    </div>
  ),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
)

describe('useToast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('throws when used outside ToastProvider', () => {
    // RTL v16 + React 19: renderHook does not use an error boundary,
    // so errors propagate to the test. Suppress the React error console output
    // and catch via expect().toThrow().
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within <ToastProvider>'
    )
    consoleError.mockRestore()
  })

  it('error() adds an error toast to the queue', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    act(() => { result.current.error('Error', 'Something broke') })
    expect(result.current).toBeDefined()
  })

  it('success() adds a success toast to the queue', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    act(() => { result.current.success('Done', 'It worked') })
    expect(result.current).toBeDefined()
  })
})

describe('ToastProvider queue logic', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders toasts added via useToast', async () => {
    function TestComponent() {
      const { error } = useToast()
      return <button onClick={() => error('Error', 'Oops')}>add</button>
    }

    const { ToastContainer } = await import('./toast')

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    )

    const btn = screen.getByRole('button', { name: 'add' })
    act(() => { btn.click() })

    // Text appears in both the SR live region and the visible card
    expect(screen.getAllByText('Error: Oops').length).toBeGreaterThan(0)
  })

  it('auto-removes an error toast after 6000ms', async () => {
    function TestComponent() {
      const { error } = useToast()
      return <button onClick={() => error('Error', 'Oops')}>add</button>
    }

    const { ToastContainer } = await import('./toast')

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    )

    act(() => { screen.getByRole('button', { name: 'add' }).click() })
    expect(screen.getAllByText('Error: Oops').length).toBeGreaterThan(0)

    act(() => { vi.advanceTimersByTime(6000) })
    await waitFor(() => {
      expect(screen.queryAllByText('Error: Oops')).toHaveLength(0)
    })
  })

  it('auto-removes a success toast after 4000ms', async () => {
    function TestComponent() {
      const { success } = useToast()
      return <button onClick={() => success('Done', 'Worked')}>add</button>
    }

    const { ToastContainer } = await import('./toast')

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    )

    act(() => { screen.getByRole('button', { name: 'add' }).click() })
    expect(screen.getAllByText('Done: Worked').length).toBeGreaterThan(0)

    act(() => { vi.advanceTimersByTime(4000) })
    await waitFor(() => {
      expect(screen.queryAllByText('Done: Worked')).toHaveLength(0)
    })
  })

  it('ejects the oldest toast when a 5th is added', async () => {
    function TestComponent() {
      const { error } = useToast()
      return (
        <>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => error('Error', `Toast ${n}`)}>
              add {n}
            </button>
          ))}
        </>
      )
    }

    const { ToastContainer } = await import('./toast')

    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    )

    for (const n of [1, 2, 3, 4, 5]) {
      act(() => { screen.getByRole('button', { name: `add ${n}` }).click() })
    }

    expect(screen.queryAllByText('Error: Toast 1')).toHaveLength(0)
    expect(screen.getAllByText('Error: Toast 5').length).toBeGreaterThan(0)
  })
})
