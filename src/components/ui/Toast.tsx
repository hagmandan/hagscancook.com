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
