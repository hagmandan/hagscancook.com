'use client'

import { useState } from 'react'
import styles from './ConfirmButton.module.css'

interface ConfirmButtonProps {
  label: string
  confirmQuestion: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void | Promise<void>
  isPending: boolean
  pendingLabel: string
  className?: string
  danger?: boolean
}

export function ConfirmButton({
  label,
  confirmQuestion,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending,
  pendingLabel,
  className,
  danger = false,
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)

  async function handleConfirm() {
    await onConfirm()
    setConfirming(false)
  }

  if (confirming) {
    return (
      <span className={`${styles.row} ${className ?? ''}`}>
        <span className={styles.question}>{confirmQuestion}</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className={`${styles.btn} ${danger ? styles.dangerBtn : ''}`}
        >
          {isPending ? pendingLabel : confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={styles.btn}
        >
          {cancelLabel}
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={`${styles.btn} ${danger ? styles.dangerBtn : ''} ${className ?? ''}`}
    >
      {label}
    </button>
  )
}
