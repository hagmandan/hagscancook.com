'use client'

/**
 * Curated unit <select> with an "Other…" free-text escape hatch.
 *
 * Presentational and form-library-agnostic: driven by `value` + `onChange`,
 * so it works with React Hook Form (via setValue) and plain useState alike.
 * Used by the recipe ingredients field and the pantry.
 */

import { useState } from 'react'
import { UNITS, UNIT_GROUPS, isKnownUnit } from '@/lib/constants/units'
import styles from './UnitSelect.module.css'

/** Sentinel <option> value that switches the control into free-text mode. */
const OTHER_UNIT = '__other__'

interface UnitSelectProps {
  value: string
  onChange: (value: string) => void
  /** Accessible label for the control. */
  ariaLabel: string
  /** Optional max length for the free-text input. */
  maxLength?: number
  'data-testid'?: string
}

export function UnitSelect({
  value,
  onChange,
  ariaLabel,
  maxLength = 30,
  'data-testid': testId,
}: UnitSelectProps) {
  // Custom mode when the value is a non-empty unit we don't recognize
  // (e.g. an imported "knob" or a previously-entered free-text unit).
  const [isCustom, setIsCustom] = useState(() => !!value && !isKnownUnit(value))

  if (isCustom) {
    return (
      <div className={styles.custom}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="unit"
          className={styles.customInput}
          maxLength={maxLength}
          aria-label={ariaLabel}
          data-testid={testId}
          autoFocus
        />
        <button
          type="button"
          className={styles.revert}
          aria-label="Choose unit from list"
          title="Choose from list"
          onClick={() => {
            onChange('')
            setIsCustom(false)
          }}
        >
          ↩
        </button>
      </div>
    )
  }

  return (
    <select
      className={styles.select}
      aria-label={ariaLabel}
      data-testid={testId}
      value={value && isKnownUnit(value) ? value : ''}
      onChange={(e) => {
        if (e.target.value === OTHER_UNIT) {
          onChange('')
          setIsCustom(true)
        } else {
          onChange(e.target.value)
        }
      }}
    >
      <option value="">— unit —</option>
      {UNIT_GROUPS.map((group) => (
        <optgroup key={group.dimension} label={group.label}>
          {UNITS.filter((u) => u.dimension === group.dimension).map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </optgroup>
      ))}
      <optgroup label="Other">
        <option value={OTHER_UNIT}>Other…</option>
      </optgroup>
    </select>
  )
}
