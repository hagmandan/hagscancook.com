'use client'

import styles from './pantry.module.css'

interface PantryIngredientPillProps {
  name: string
  selected: boolean
  onToggle: (name: string) => void
}

export function PantryIngredientPill({ name, selected, onToggle }: PantryIngredientPillProps) {
  return (
    <button
      type="button"
      className={`${styles.pill} ${selected ? styles.pillSelected : ''}`}
      onClick={() => onToggle(name)}
      aria-pressed={selected}
      data-testid={`pantry-pill-${name.replace(/\s+/g, '-')}`}
    >
      {name}
    </button>
  )
}
