'use client'

import { useState, useTransition } from 'react'
import { deleteTag } from '@/lib/actions/admin'
import styles from '../admin.module.css'

export function AdminTagActions({ tagId, recipeCount }: { tagId: string; recipeCount: number }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteTag(tagId)
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <span style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
        {recipeCount > 0 && (
          <span style={{ fontSize: '0.8125rem', color: '#92400e' }}>
            Removes from {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}.
          </span>
        )}
        <button onClick={handleDelete} disabled={isPending} className={`${styles.actionBtn} ${styles.dangerBtn}`} type="button">
          {isPending ? '…' : 'Delete'}
        </button>
        <button onClick={() => setConfirming(false)} className={styles.actionBtn} type="button">Cancel</button>
      </span>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className={`${styles.actionBtn} ${styles.dangerBtn}`} type="button">
      Delete
    </button>
  )
}
