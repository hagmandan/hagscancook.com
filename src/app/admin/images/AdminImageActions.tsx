'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveRecipeImage, rejectRecipeImage } from '@/lib/actions/admin'

export function AdminImageActions({ recipeId }: { recipeId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setPending('approve')
    setError(null)
    const result = await approveRecipeImage(recipeId)
    setPending(null)
    if ('error' in result) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  async function handleReject() {
    setPending('reject')
    setError(null)
    const result = await rejectRecipeImage(recipeId)
    setPending(null)
    if ('error' in result) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={handleApprove} disabled={pending !== null}>
          {pending === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <button onClick={handleReject} disabled={pending !== null}>
          {pending === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
      {error && <p style={{ color: 'red', margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>{error}</p>}
    </div>
  )
}
