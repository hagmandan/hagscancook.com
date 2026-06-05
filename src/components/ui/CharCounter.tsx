'use client'

import styles from './CharCounter.module.css'

interface CharCounterProps {
  value: string | undefined
  max: number
}

export function CharCounter({ value, max }: CharCounterProps) {
  const len = value?.length ?? 0
  const pct = len / max

  return (
    <span
      className={`${styles.counter} ${pct >= 1 ? styles.over : pct >= 0.8 ? styles.near : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {len} / {max}
    </span>
  )
}
