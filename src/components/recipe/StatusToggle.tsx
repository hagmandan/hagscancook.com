'use client'

import { useState } from 'react'
import { toggleRecipeStatus } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import styles from './StatusToggle.module.css'

interface StatusToggleProps {
  recipeId: string
  currentStatus: 'draft' | 'published'
}

export function StatusToggle({ recipeId, currentStatus }: StatusToggleProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function handleToggle() {
    setLoading(true)
    const result = await toggleRecipeStatus(recipeId)
    setLoading(false)

    if ('error' in result) {
      toast.error('Error', result.error)
      return
    }

    setStatus(result.status)
    toast.success(
      result.status === 'published' ? 'Published' : 'Moved to drafts',
      result.status === 'published'
        ? 'Your recipe is now live.'
        : 'Your recipe is now hidden from others.'
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`${styles.toggle} ${status === 'published' ? styles.published : styles.draft}`}
    >
      {loading ? '…' : status === 'published' ? 'Unpublish' : 'Publish'}
    </button>
  )
}
