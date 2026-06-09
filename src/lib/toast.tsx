'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Toast } from '@/components/ui/Toast'

export interface ToastItem {
  id: string
  type: 'error' | 'success'
  title: string
  message: string
}

interface ToastContextValue {
  toasts: ToastItem[]
  addToast: (item: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = { error: 6000, success: 4000 } as const
const MAX_VISIBLE = 4

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const removeToast = useCallback((id: string) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((prev) => {
        const next = [...prev, { ...item, id }]
        if (next.length > MAX_VISIBLE) {
          const ejected = next.slice(0, next.length - MAX_VISIBLE)
          ejected.forEach((t) => {
            clearTimeout(timers.current.get(t.id))
            timers.current.delete(t.id)
          })
          return next.slice(-MAX_VISIBLE)
        }
        return next
      })
      const timer = setTimeout(() => removeToast(id), AUTO_DISMISS_MS[item.type])
      timers.current.set(id, timer)
    },
    [removeToast]
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => activeTimers.forEach((t) => clearTimeout(t))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return {
    error: (title: string, message: string) =>
      ctx.addToast({ type: 'error', title, message }),
    success: (title: string, message: string) =>
      ctx.addToast({ type: 'success', title, message }),
  }
}

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export function ToastContainer() {
  const ctx = useContext(ToastContext)
  // ToastContainer may be rendered outside ToastProvider in tests — fail gracefully
  if (!ctx) return null
  const { toasts, removeToast } = ctx

  const latestError = toasts.filter((t) => t.type === 'error').at(-1)
  const latestSuccess = toasts.filter((t) => t.type === 'success').at(-1)

  return (
    <>
      {/* Visually hidden live regions — text content triggers SR announcements */}
      <div aria-live="assertive" aria-atomic="true" style={SR_ONLY}>
        {latestError && `${latestError.title}: ${latestError.message}`}
      </div>
      <div aria-live="polite" aria-atomic="true" style={SR_ONLY}>
        {latestSuccess && `${latestSuccess.title}: ${latestSuccess.message}`}
      </div>

      {/* Visible toast stack */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </>
  )
}
