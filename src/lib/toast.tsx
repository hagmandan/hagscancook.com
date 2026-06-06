'use client'

import {
  createContext,
  useCallback,
  useContext,
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
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next
      })
      const timer = setTimeout(() => removeToast(id), AUTO_DISMISS_MS[item.type])
      timers.current.set(id, timer)
    },
    [removeToast]
  )

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

export function ToastContainer() {
  const ctx = useContext(ToastContext)
  if (!ctx) return null
  const { toasts, removeToast } = ctx

  return (
    <>
      {/*
       * Error toasts: assertive live region for immediate SR announcement.
       * Success toasts: polite live region to avoid interrupting SR.
       * The visible stack below is aria-hidden; these regions are the a11y surface.
       */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-label={toasts.filter((t) => t.type === 'error').at(-1)?.message}
        style={{ display: 'none' }}
      />
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={toasts.filter((t) => t.type === 'success').at(-1)?.message}
        style={{ display: 'none' }}
      />

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
