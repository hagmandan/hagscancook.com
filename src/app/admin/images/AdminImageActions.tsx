'use client'

import { useState } from 'react'
import { approveRecipeImage, rejectRecipeImage } from '@/lib/actions/admin'

export function AdminImageActions({ recipeId }: { recipeId: string }) {
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null)

  async function handleApprove() {
    setPending('approve')
    await approveRecipeImage(recipeId)
    setPending(null)
  }

  async function handleReject() {
    setPending('reject')
    await rejectRecipeImage(recipeId)
    setPending(null)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
      <button onClick={handleApprove} disabled={pending !== null}>
        {pending === 'approve' ? 'Approving…' : 'Approve'}
      </button>
      <button onClick={handleReject} disabled={pending !== null}>
        {pending === 'reject' ? 'Rejecting…' : 'Reject'}
      </button>
    </div>
  )
}
