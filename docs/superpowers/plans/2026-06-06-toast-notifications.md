# Toast Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an app-level toast notification service that surfaces Server Action errors (and select success confirmations) via bottom-right card toasts, using no new dependencies.

**Architecture:** A `ToastProvider` added to the existing `Providers.tsx` holds the queue in React state. Client components call `useToast()` to fire toasts. A `ToastContainer` rendered in `layout.tsx` (inside `<Providers>`) renders the visible stack and two hidden ARIA live regions for screen reader announcements.

**Tech Stack:** React context + hooks, CSS Modules, Vitest + React Testing Library (@testing-library/react), Next.js App Router Server Actions.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/toast.tsx` | Context, `ToastProvider`, `useToast()`, `ToastContainer` |
| Create | `src/lib/toast.test.tsx` | Unit tests for provider queue logic |
| Create | `src/components/ui/Toast.tsx` | Single toast card component |
| Create | `src/components/ui/Toast.module.css` | Card styles using existing CSS tokens |
| Create | `src/components/ui/Toast.test.tsx` | RTL tests for card component |
| Modify | `src/components/layout/Providers.tsx` | Wrap with `<ToastProvider>` |
| Modify | `src/app/layout.tsx` | Add `<ToastContainer>` inside `<Providers>` |
| Modify | `src/components/recipe/FavoriteButton.tsx` | Call `toast.error()` on failure |
| Modify | `src/app/admin/AdminRecipeActions.tsx` | Check results; call `toast.error/success` |
| Modify | `src/app/my-recipes/RecipeRowActions.tsx` | Check `deleteRecipe` result; call `toast.error()` |

---

## Task 1: Toast context, provider, and hook

**Files:**
- Create: `src/lib/toast.tsx`
- Create: `src/lib/toast.test.tsx`

- [ ] **Step 1.1: Write the failing tests**

Create `src/lib/toast.test.tsx`:

```tsx
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
    const { result } = renderHook(() => useToast())
    expect(result.error).toBeInstanceOf(Error)
  })

  it('error() adds an error toast to the queue', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    act(() => { result.current.error('Error', 'Something broke') })
    // Access the internal context via a second hook call in same provider
    // Verified indirectly through ToastContainer rendering in Task 3
    // Here we just confirm no throw occurred
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

    expect(screen.getByText('Error: Oops')).toBeInTheDocument()
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
    expect(screen.getByText('Error: Oops')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(6000) })
    await waitFor(() => {
      expect(screen.queryByText('Error: Oops')).not.toBeInTheDocument()
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
    expect(screen.getByText('Done: Worked')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(4000) })
    await waitFor(() => {
      expect(screen.queryByText('Done: Worked')).not.toBeInTheDocument()
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

    expect(screen.queryByText('Error: Toast 1')).not.toBeInTheDocument()
    expect(screen.getByText('Error: Toast 5')).toBeInTheDocument()
  })
})
```

- [ ] **Step 1.2: Run tests to confirm they fail**

```bash
yarn test src/lib/toast.test.tsx --run
```

Expected: several failures including `Cannot find module './toast'`.

- [ ] **Step 1.3: Create `src/lib/toast.tsx`**

```tsx
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
  if (!ctx) return null
  const { toasts, removeToast } = ctx

  const latestError = toasts.filter((t) => t.type === 'error').at(-1)
  const latestSuccess = toasts.filter((t) => t.type === 'success').at(-1)

  return (
    <>
      {/* Visually hidden live regions — screen reader announcements */}
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
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 1.4: Run tests to confirm they pass**

```bash
yarn test src/lib/toast.test.tsx --run
```

Expected: all tests pass. If `crypto.randomUUID` is undefined in jsdom, add this to `src/test-setup.ts`:
```ts
if (!globalThis.crypto?.randomUUID) {
  let counter = 0
  globalThis.crypto = { ...globalThis.crypto, randomUUID: () => `test-id-${++counter}` } as Crypto
}
```

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/toast.tsx src/lib/toast.test.tsx src/test-setup.ts
git commit -m "feat: add ToastProvider, useToast hook, and ToastContainer"
```

---

## Task 2: Toast card component

**Files:**
- Create: `src/components/ui/Toast.tsx`
- Create: `src/components/ui/Toast.module.css`
- Create: `src/components/ui/Toast.test.tsx`

- [ ] **Step 2.1: Write the failing tests**

Create `src/components/ui/Toast.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from './Toast'
import type { ToastItem } from '@/lib/toast'

const errorToast: ToastItem = {
  id: 'test-1',
  type: 'error',
  title: 'Error',
  message: 'Could not update favorite',
}

const successToast: ToastItem = {
  id: 'test-2',
  type: 'success',
  title: 'Done',
  message: 'Recipe deleted',
}

describe('Toast', () => {
  it('renders the title and message', () => {
    render(<Toast toast={errorToast} onDismiss={() => {}} />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Could not update favorite')).toBeInTheDocument()
  })

  it('renders a dismiss button with accessible label', () => {
    render(<Toast toast={errorToast} onDismiss={() => {}} />)
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn()
    render(<Toast toast={errorToast} onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    // onDismiss is called after the 250ms exit animation
    await new Promise((r) => setTimeout(r, 260))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('renders a success toast', () => {
    render(<Toast toast={successToast} onDismiss={() => {}} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Recipe deleted')).toBeInTheDocument()
  })

  it('has role="status" for screen readers', () => {
    render(<Toast toast={errorToast} onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
yarn test src/components/ui/Toast.test.tsx --run
```

Expected: failures including `Cannot find module './Toast'`.

- [ ] **Step 2.3: Create `src/components/ui/Toast.tsx`**

```tsx
'use client'

import { useState } from 'react'
import type { ToastItem } from '@/lib/toast'
import styles from './Toast.module.css'

interface ToastProps {
  toast: ToastItem
  onDismiss: () => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  function handleDismiss() {
    setIsExiting(true)
    setTimeout(onDismiss, 250)
  }

  return (
    <div
      role="status"
      className={`${styles.toast} ${styles[toast.type]} ${
        isExiting ? styles.exiting : styles.entering
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      <div className={styles.header}>
        <span className={styles.title}>{toast.title}</span>
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Dismiss notification"
          onClick={handleDismiss}
        >
          ✕
        </button>
      </div>
      <p className={styles.message}>{toast.message}</p>
    </div>
  )
}
```

- [ ] **Step 2.4: Create `src/components/ui/Toast.module.css`**

```css
@keyframes toastIn {
  from { transform: translateY(1.5rem); opacity: 0; }
  to   { transform: translateY(0);      opacity: 1; }
}

@keyframes toastOut {
  from { transform: translateY(0);      opacity: 1; }
  to   { transform: translateY(1.5rem); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes toastIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes toastOut { from { opacity: 1; } to { opacity: 0; } }
}

.toast {
  width: 20rem;
  background: var(--color-surface);
  border: 1px solid;
  border-radius: 0.5rem;
  border-left-width: 3px;
  padding: 0.75rem 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.entering { animation: toastIn  0.25s ease forwards; }
.exiting  { animation: toastOut 0.25s ease forwards; }

.error {
  border-color: var(--color-error-border);
  border-left-color: var(--color-error);
}

.success {
  border-color: var(--color-success-border);
  border-left-color: var(--color-success);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.title {
  font-size: 0.875rem;
  font-weight: 700;
}

.error .title   { color: var(--color-error); }
.success .title { color: var(--color-success); }

.dismiss {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-4);
  font-size: 0.75rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  line-height: 1;
  transition: color 0.1s ease, background-color 0.1s ease;
}

.dismiss:hover {
  color: var(--color-text-2);
  background-color: var(--color-surface-raised);
}

.message {
  font-size: 0.875rem;
  color: var(--color-text-2);
  margin: 0;
  line-height: 1.5;
}
```

- [ ] **Step 2.5: Run tests to confirm they pass**

```bash
yarn test src/components/ui/Toast.test.tsx --run
```

Expected: all 5 tests pass.

- [ ] **Step 2.6: Run the full test suite to confirm nothing regressed**

```bash
yarn test --run
```

Expected: all tests pass.

- [ ] **Step 2.7: Commit**

```bash
git add src/components/ui/Toast.tsx src/components/ui/Toast.module.css src/components/ui/Toast.test.tsx
git commit -m "feat: add Toast card component with entry/exit animation and a11y"
```

---

## Task 3: Wire ToastProvider and ToastContainer into the app

**Files:**
- Modify: `src/components/layout/Providers.tsx`
- Modify: `src/app/layout.tsx`

No new tests needed — the provider is covered by Task 1 tests, and layout wiring is verified by the app running.

- [ ] **Step 3.1: Add `ToastProvider` to `Providers.tsx`**

The file currently exports `Providers` and `useAuth`. Add `ToastProvider` as the outermost wrapper:

```tsx
'use client'

/**
 * Client-side providers wrapper.
 *
 * This is a thin `'use client'` boundary that wraps the application in any
 * global context providers. It is imported by the Server Component
 * `src/app/layout.tsx` so that the layout itself stays a Server Component
 * while still giving the client tree access to Firebase Auth state.
 *
 * Currently provides:
 *   - `ToastContext` — app-level toast notification queue
 *   - `AuthContext` — current Firebase user + sign-out helper
 *
 * Add additional providers inside the outer `<>` fragment.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'
import { ToastProvider } from '@/lib/toast'

// ---------------------------------------------------------------------------
// Auth context
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** The currently signed-in Firebase user, or null if unauthenticated. */
  user: User | null
  /** True while the initial auth state is loading (first render). */
  loading: boolean
  /** Signs the user out, clears the session cookie, and redirects to /login. */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
})

/** Hook to access the current Firebase auth state in any Client Component. */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function logout() {
    await signOut(auth)
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <ToastProvider>
      <AuthContext.Provider value={{ user, loading, logout }}>
        {children}
      </AuthContext.Provider>
    </ToastProvider>
  )
}
```

- [ ] **Step 3.2: Add `<ToastContainer>` to `layout.tsx`**

Add the import and place `<ToastContainer>` inside `<Providers>` after `<Footer>`:

```tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastContainer } from '@/lib/toast'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hagscancook.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'HagsCanCook',
    template: '%s — HagsCanCook',
  },
  description: 'A community recipe site for home cooks.',
  openGraph: {
    siteName: 'HagsCanCook',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
}

/**
 * Root layout — shared across all routes.
 *
 * Renders as a Server Component. `<Providers>` is the client boundary that
 * wraps the app in Firebase Auth and Toast contexts. `<Header>` and `<Footer>`
 * are Server Components; the auth-aware `<UserMenu>` inside Header is a Client
 * Component island.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      {/* Prevent flash of wrong theme by reading localStorage before first paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3.3: Run the full test suite**

```bash
yarn test --run
```

Expected: all tests pass.

- [ ] **Step 3.4: Commit**

```bash
git add src/components/layout/Providers.tsx src/app/layout.tsx
git commit -m "feat: wire ToastProvider and ToastContainer into app layout"
```

---

## Task 4: Wire `FavoriteButton`

**Files:**
- Modify: `src/components/recipe/FavoriteButton.tsx`

- [ ] **Step 4.1: Update `FavoriteButton.tsx`**

Add `useToast` import and call `toast.error()` when the Server Action returns an error:

```tsx
'use client'

/**
 * Favorite toggle button — shown on recipe detail pages.
 *
 * Calls the `toggleFavorite` Server Action and updates local state
 * optimistically while the action resolves.
 */

import { useState, useTransition } from 'react'
import { toggleFavorite } from '@/lib/actions/favorites'
import { useToast } from '@/lib/toast'
import styles from './FavoriteButton.module.css'

interface FavoriteButtonProps {
  recipeId: string
  recipeSlug: string
  initialFavorited: boolean
}

export function FavoriteButton({
  recipeId,
  recipeSlug,
  initialFavorited,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  function handleClick() {
    // Optimistic update
    setFavorited((prev) => !prev)
    startTransition(async () => {
      const result = await toggleFavorite(recipeId, recipeSlug)
      if ('error' in result) {
        setFavorited((prev) => !prev)
        toast.error('Error', 'Could not update favorite')
      } else {
        setFavorited(result.favorited)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`${styles.button} ${favorited ? styles.favorited : ''}`}
      aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
      aria-pressed={favorited}
      data-testid="favorite-button"
    >
      <span className={styles.icon} aria-hidden>{favorited ? '♥' : '♡'}</span>
      <span>{favorited ? 'Saved' : 'Save'}</span>
    </button>
  )
}
```

- [ ] **Step 4.2: Run full test suite**

```bash
yarn test --run
```

Expected: all tests pass.

- [ ] **Step 4.3: Commit**

```bash
git add src/components/recipe/FavoriteButton.tsx
git commit -m "feat: show error toast when favorite toggle fails"
```

---

## Task 5: Wire `AdminRecipeActions`

**Files:**
- Modify: `src/app/admin/AdminRecipeActions.tsx`

- [ ] **Step 5.1: Update `AdminRecipeActions.tsx`**

Add `useToast`, capture action results, and fire toasts. The current implementation is fire-and-forget — this adds full result checking:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { unpublishRecipe, adminDeleteRecipe } from '@/lib/actions/admin'
import { useToast } from '@/lib/toast'
import styles from './admin.module.css'

interface AdminRecipeActionsProps {
  recipeId: string
  recipeSlug: string
  status: string
}

export function AdminRecipeActions({ recipeId, recipeSlug, status }: AdminRecipeActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const toast = useToast()

  function handleUnpublish() {
    startTransition(async () => {
      const result = await unpublishRecipe(recipeId)
      if ('error' in result) {
        toast.error('Error', 'Could not unpublish recipe')
      } else {
        toast.success('Done', 'Recipe unpublished')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await adminDeleteRecipe(recipeId)
      if ('error' in result) {
        toast.error('Error', 'Could not delete recipe')
      } else {
        toast.success('Done', 'Recipe deleted')
      }
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <span className={styles.actionRow}>
        <span className={styles.confirmLabel}>Delete?</span>
        <button onClick={handleDelete} disabled={isPending} className={`${styles.actionBtn} ${styles.dangerBtn}`} type="button">
          {isPending ? '…' : 'Yes'}
        </button>
        <button onClick={() => setConfirming(false)} className={styles.actionBtn} type="button">No</button>
      </span>
    )
  }

  return (
    <span className={styles.actionRow}>
      <a href={`/recipes/${recipeSlug}/edit`} className={styles.actionBtn} style={{ textDecoration: 'none' }}>Edit</a>
      {status === 'published' && (
        <button onClick={handleUnpublish} disabled={isPending} className={styles.actionBtn} type="button">
          Unpublish
        </button>
      )}
      <button onClick={() => setConfirming(true)} className={`${styles.actionBtn} ${styles.dangerBtn}`} type="button">
        Delete
      </button>
    </span>
  )
}
```

- [ ] **Step 5.2: Run full test suite**

```bash
yarn test --run
```

Expected: all tests pass.

- [ ] **Step 5.3: Commit**

```bash
git add src/app/admin/AdminRecipeActions.tsx
git commit -m "feat: show error/success toasts for admin recipe actions"
```

---

## Task 6: Wire `RecipeRowActions`

**Files:**
- Modify: `src/app/my-recipes/RecipeRowActions.tsx`

- [ ] **Step 6.1: Update `RecipeRowActions.tsx`**

Add `useToast` and check the result of `deleteRecipe`. On success, `deleteRecipe` calls `redirect()` server-side — the component unmounts and we never reach the check below. On failure, it returns `{ error: string }`.

```tsx
'use client'

/**
 * Edit / Delete action buttons for a recipe row in My Recipes.
 *
 * Client Component because delete confirmation and the Server Action call
 * need interactivity. The Server Action `deleteRecipe` handles its own
 * redirect after soft-deletion.
 */

import Link from 'next/link'
import { useState } from 'react'
import { deleteRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import styles from './my-recipes.module.css'

interface RecipeRowActionsProps {
  recipeId: string
  recipeSlug: string
  status: 'draft' | 'published'
}

export function RecipeRowActions({ recipeId, recipeSlug, status }: RecipeRowActionsProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteRecipe(recipeId)
    // If deleteRecipe succeeded it called redirect() — component unmounts
    // and we never reach here. If we do reach here, there was an error.
    if ('error' in result) {
      toast.error('Error', 'Could not delete recipe')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className={styles.confirmRow}>
        <span className={styles.confirmText}>Delete this recipe?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={styles.confirmYes}
          type="button"
        >
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className={styles.confirmNo}
          type="button"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className={styles.actions}>
      <Link
        href={`/recipes/${recipeSlug}/edit`}
        className={styles.actionButton}
      >
        Edit
      </Link>
      {status === 'draft' && (
        <Link
          href={`/recipes/${recipeSlug}/edit?publish=1`}
          className={styles.publishButton}
        >
          Publish
        </Link>
      )}
      <button
        onClick={() => setConfirming(true)}
        className={styles.deleteButton}
        type="button"
      >
        Delete
      </button>
    </div>
  )
}
```

- [ ] **Step 6.2: Run the full test suite**

```bash
yarn test --run
```

Expected: all tests pass.

- [ ] **Step 6.3: Type-check the whole project**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6.4: Commit**

```bash
git add src/app/my-recipes/RecipeRowActions.tsx
git commit -m "feat: show error toast when recipe delete fails in my-recipes"
```

---

## Verification

### Manual smoke test (run `yarn dev` and test each path):

1. **FavoriteButton error path** — temporarily break `toggleFavorite` to return `{ error: 'test' }`, click the heart on a recipe, confirm a red card toast appears bottom-right with title "Error" and message "Could not update favorite". Undo the break.

2. **AdminRecipeActions** — visit `/admin`, unpublish a recipe. Confirm a green "Done / Recipe unpublished" toast appears.

3. **AdminRecipeActions delete** — delete a recipe from `/admin`. Confirm a green "Done / Recipe deleted" toast.

4. **Stacking** — trigger multiple toasts in quick succession (open browser console and call multiple `toast.error()` calls). Confirm they stack upward and the oldest is ejected when a 5th arrives.

5. **Auto-dismiss** — trigger a success toast. Confirm it disappears after ~4 s without interaction.

6. **Manual dismiss** — trigger a toast and click ✕. Confirm it slides back down and disappears within 250 ms.

7. **Screen reader** — open VoiceOver or NVDA, trigger an error toast. Confirm it announces "Error: Could not update favorite" without focus moving.

8. **Reduced motion** — in System Preferences → Accessibility → Reduce Motion, trigger a toast. Confirm it fades in rather than sliding up.
