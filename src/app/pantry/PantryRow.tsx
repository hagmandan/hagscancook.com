'use client'

import { useState, useTransition } from 'react'
import { UnitSelect } from '@/components/ui/UnitSelect'
import {
  updatePantryItem,
  removePantryItem,
  togglePantryItemOutOfStock,
  type PantryItemView,
} from '@/lib/actions/pantry'
import { PANTRY_LIMITS } from '@/lib/schemas/pantry'
import styles from './pantry.module.css'

interface PantryRowProps {
  item: PantryItemView
  showCategory?: boolean
  onUpdated: (item: PantryItemView) => void
  onRemoved: (id: string) => void
}

export function PantryRow({
  item,
  showCategory = false,
  onUpdated,
  onRemoved,
}: PantryRowProps) {
  const [editing, setEditing] = useState(false)
  const [oos, setOos] = useState(item.outOfStock)
  const [amount, setAmount] = useState(item.amount ?? '')
  const [unit, setUnit] = useState(item.unit ?? '')
  const [note, setNote] = useState(item.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function startEdit() {
    setAmount(item.amount ?? '')
    setUnit(item.unit ?? '')
    setNote(item.note ?? '')
    setError(null)
    setEditing(true)
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updatePantryItem(item.id, { amount, unit, note })
      if ('error' in result) {
        setError(result.error)
        return
      }
      onUpdated(result.item)
      setEditing(false)
    })
  }

  function handleToggleOos() {
    const prevOos = oos
    const newOos = !prevOos
    setOos(newOos)
    onUpdated({ ...item, outOfStock: newOos })
    startTransition(async () => {
      const result = await togglePantryItemOutOfStock(item.id)
      if ('error' in result) {
        setOos(prevOos)
        onUpdated({ ...item, outOfStock: prevOos })
        setError(result.error)
      } else {
        onUpdated(result.item)
      }
    })
  }

  function handleRemove() {
    onRemoved(item.id)
    startTransition(async () => {
      const result = await removePantryItem(item.id)
      if ('error' in result) {
        onUpdated(item)
        setError(result.error)
      }
    })
  }

  if (editing) {
    return (
      <li className={styles.row}>
        <div className={styles.editFields}>
          <span className={styles.itemName}>{item.ingredient.name}</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className={styles.amountInput}
            maxLength={PANTRY_LIMITS.AMOUNT}
            aria-label="Amount"
          />
          <div className={styles.unitCell}>
            <UnitSelect
              value={unit}
              onChange={setUnit}
              ariaLabel="Unit"
              maxLength={PANTRY_LIMITS.UNIT}
            />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className={styles.noteInput}
            maxLength={PANTRY_LIMITS.NOTE}
            aria-label="Note"
          />
        </div>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={save}
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => setEditing(false)}
            disabled={isPending}
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </li>
    )
  }

  return (
    <li className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.itemName}>{item.ingredient.name}</span>
        {oos && <span className={styles.oosBadge}>OUT</span>}
        {showCategory && <span className={styles.categoryTag}>{item.type.name}</span>}
        {(item.amount || item.unit) && (
          <span className={styles.itemAmount}>
            {[item.amount, item.unit].filter(Boolean).join(' ')}
          </span>
        )}
        {item.note && <span className={styles.itemNote}>{item.note}</span>}
      </div>
      <div className={styles.rowActions}>
        <button
          type="button"
          className={oos ? styles.oosToggleActive : styles.oosToggle}
          onClick={handleToggleOos}
          disabled={isPending}
          aria-label={oos ? `Mark ${item.ingredient.name} in stock` : `Mark ${item.ingredient.name} out of stock`}
          title={oos ? `Mark ${item.ingredient.name} in stock` : `Mark ${item.ingredient.name} out of stock`}
          aria-pressed={oos}
        >
          {oos ? '✓ Out' : 'Out'}
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={startEdit}
          aria-label={`Edit ${item.ingredient.name}`}
          title={`Edit ${item.ingredient.name}`}
        >
          ✎
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={handleRemove}
          disabled={isPending}
          aria-label={`Remove ${item.ingredient.name} from pantry`}
          title={`Remove ${item.ingredient.name} from pantry`}
        >
          ✕
        </button>
      </div>
    </li>
  )
}
