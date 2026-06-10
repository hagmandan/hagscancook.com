'use client'

import { useEffect } from 'react'
import { captureException } from '@/lib/monitoring/errors'

export default function FavoritesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error, { feature: 'favorites', runtime: 'client' })
  }, [error])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <p>There was a problem loading your favorites.</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
