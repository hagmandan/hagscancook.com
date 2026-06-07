'use client'

/**
 * Pantry manager — quick-add + grouped, inline-editable list.
 *
 * Seeded from server props; each add/edit/remove calls a Server Action and
 * reconciles local state from the response (optimistic remove with revert).
 * Mirrors the optimistic pattern in components/recipe/FavoriteButton.tsx.
 */

import { useMemo, useState, useTransition } from 'react'
import { UnitSelect } from '@/components/ui/UnitSelect'
import {
  addPantryItem,
  type PantryItemView,
} from '@/lib/actions/pantry'
import { PANTRY_LIMITS } from '@/lib/schemas/pantry'
import { PantryCategoryBoard } from './PantryCategoryBoard'
import { PantryRow } from './PantryRow'
import styles from './pantry.module.css'

interface PantryManagerProps {
  initialItems: PantryItemView[]
  ingredientTypes: { id: string; name: string; slug: string }[]
}

export function PantryManager({ initialItems, ingredientTypes }: PantryManagerProps) {
  const [items, setItems] = useState(initialItems)

  function upsertLocal(item: PantryItemView) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id)
      if (idx === -1) return [...prev, item]
      const next = [...prev]
      next[idx] = item
      return next
    })
  }

  function removeLocal(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  const [view, setView] = useState<'list' | 'category'>(
    initialItems.length === 0 ? 'category' : 'list'
  )
  const [sortBy, setSortBy] = useState<'category' | 'name'>('category')

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'category') {
        const byType = a.type.name.localeCompare(b.type.name)
        if (byType !== 0) return byType
      }
      return a.ingredient.name.localeCompare(b.ingredient.name)
    })
  }, [items, sortBy])

  const showEmptyList = items.length === 0 && view === 'list'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pantry</h1>
        <p className={styles.subtitle}>
          Keep track of what&apos;s in your kitchen.
        </p>
      </div>

      <QuickAdd ingredientTypes={ingredientTypes} onAdded={upsertLocal} />

      <div className={styles.toolbar}>
        <div className={styles.viewToggle} role="group" aria-label="View mode">
          <button
            type="button"
            className={`${styles.toggleButton} ${view === 'list' ? styles.toggleActive : ''}`}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            data-testid="pantry-view-list"
          >
            List
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${view === 'category' ? styles.toggleActive : ''}`}
            onClick={() => setView('category')}
            aria-pressed={view === 'category'}
            data-testid="pantry-view-category"
          >
            Categories
          </button>
        </div>

        {view === 'list' && items.length > 0 && (
          <label className={styles.sortControl}>
            <span className={styles.sortLabel}>Sort by</span>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'category' | 'name')}
              data-testid="pantry-sort"
            >
              <option value="category">Category</option>
              <option value="name">Name</option>
            </select>
          </label>
        )}
      </div>

      {showEmptyList ? (
        <div className={styles.empty}>
          <p>Your pantry is empty.</p>
          <p className={styles.emptyHint}>
            Add what you have on hand using the field above, or switch to
            Categories to pick common ingredients.
          </p>
        </div>
      ) : view === 'list' ? (
        <ul className={styles.list} role="list">
          {sortedItems.map((item) => (
            <PantryRow
              key={item.id}
              item={item}
              showCategory={sortBy === 'category'}
              onUpdated={upsertLocal}
              onRemoved={removeLocal}
            />
          ))}
        </ul>
      ) : (
        <PantryCategoryBoard
          items={items}
          ingredientTypes={ingredientTypes}
          onUpdated={upsertLocal}
          onRemoved={removeLocal}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick add
// ---------------------------------------------------------------------------

function QuickAdd({
  ingredientTypes,
  onAdded,
}: {
  ingredientTypes: { id: string; name: string; slug: string }[]
  onAdded: (item: PantryItemView) => void
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('')
  const [typeId, setTypeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setError(null)

    startTransition(async () => {
      const result = await addPantryItem({
        ingredientName: trimmed,
        amount,
        unit,
        typeId,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      onAdded(result.item)
      setName('')
      setAmount('')
      setUnit('')
      setTypeId('')
    })
  }

  return (
    <form className={styles.quickAdd} onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add an ingredient…"
        className={styles.nameInput}
        maxLength={PANTRY_LIMITS.INGREDIENT_NAME}
        aria-label="Ingredient name"
        data-testid="pantry-add-name"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className={styles.amountInput}
        maxLength={PANTRY_LIMITS.AMOUNT}
        aria-label="Amount"
        data-testid="pantry-add-amount"
      />
      <div className={styles.unitCell}>
        <UnitSelect
          value={unit}
          onChange={setUnit}
          ariaLabel="Unit"
          maxLength={PANTRY_LIMITS.UNIT}
          data-testid="pantry-add-unit"
        />
      </div>
      <select
        value={typeId}
        onChange={(e) => setTypeId(e.target.value)}
        className={styles.typeSelect}
        aria-label="Category (for new ingredients)"
        title="Category — only used when adding a brand-new ingredient"
      >
        <option value="">— category —</option>
        {ingredientTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className={styles.addButton}
        disabled={isPending || !name.trim()}
        data-testid="pantry-add-submit"
      >
        {isPending ? 'Adding…' : 'Add'}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
