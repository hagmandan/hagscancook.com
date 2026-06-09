'use client'

/**
 * Auth-gated nav links shown in the main header nav (right column).
 *
 * Client island (reads AuthContext via useAuth) so the server-rendered Header
 * can stay static. Renders nothing while auth state is resolving or for guests.
 */

import Link from 'next/link'
import { useAuth } from './Providers'

export function AuthNavLinks({ className }: { className?: string }) {
  const { user, loading } = useAuth()

  if (loading || !user) return null

  return (
    <>
      <Link href="/my-recipes" className={className}>
        My Recipes
      </Link>
      <Link href="/pantry" className={className}>
        My Pantry
      </Link>
    </>
  )
}
