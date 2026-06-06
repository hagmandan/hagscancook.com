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
 *   - `AuthContext` — current Firebase user + sign-out helper
 *
 * Add additional providers (e.g. toast, theme) inside the outer `<>` fragment.
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

/**
 * Props for the Providers wrapper.
 */
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
    // Clear the server-side session cookie by hitting a sign-out endpoint.
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
