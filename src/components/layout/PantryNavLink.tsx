'use client'

/**
 * Top-level "Pantry" nav link, shown only to authenticated users.
 *
 * Client island (reads AuthContext via useAuth) so the server-rendered Header
 * can stay static. Renders nothing while auth state is resolving or for guests.
 */

import Link from 'next/link'
import { useAuth } from './Providers'

export function PantryNavLink({ className }: { className?: string }) {
  const { user, loading } = useAuth()

  if (loading || !user) return null

  return (
    <Link href="/pantry" className={className}>
      Pantry
    </Link>
  )
}
