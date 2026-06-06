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
  updatePantryItem,
  removePantryItem,
  type PantryItemView,
} from '@/lib/actions/pantry'
import { PANTRY_LIMITS } from '@/lib/schemas/pantry'
import styles from './pantry.module.css'

interface PantryManagerProps {
  initialItems: PantryItemView[]
  ingredientTypes: { id: string; name: string }[]
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

  const [view, setView] = useState<'list' | 'category'>('list')
  const [sortBy, setSortBy] = useState<'category' | 'name'>('category')

  // Categories for the grid view — alphabetical within and across groups.
  const groups = useMemo(() => {
    const byType = new Map<string, PantryItemView[]>()
    for (const item of items) {
      const list = byType.get(item.type.name) ?? []
      list.push(item)
      byType.set(item.type.name, list)
    }
    return [...byType.entries()]
      .map(([name, list]) => ({
        name,
        items: [...list].sort((a, b) =>
          a.ingredient.name.localeCompare(b.ingredient.name)
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  // Flat list for the list view — sorted by the chosen key.
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'category') {
        const byType = a.type.name.localeCompare(b.type.name)
        if (byType !== 0) return byType
      }
      return a.ingredient.name.localeCompare(b.ingredient.name)
    })
  }, [items, sortBy])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pantry</h1>
        <p className={styles.subtitle}>
          Keep track of what&apos;s in your kitchen.
        </p>
      </div>

      <QuickAdd ingredientTypes={ingredientTypes} onAdded={upsertLocal} />

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Your pantry is empty.</p>
          <p className={styles.emptyHint}>
            Add what you have on hand using the field above.
          </p>
        </div>
      ) : (
        <>
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

            {view === 'list' && (
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

          {view === 'list' ? (
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
            <div className={styles.categoryGrid}>
              {groups.map((group) => (
                <section key={group.name} className={styles.categoryCard}>
                  <h2 className={styles.sectionTitle}>{group.name}</h2>
                  <ul className={styles.list} role="list">
                    {group.items.map((item) => (
                      <PantryRow
                        key={item.id}
                        item={item}
                        onUpdated={upsertLocal}
                        onRemoved={removeLocal}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
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
  ingredientTypes: { id: string; name: string }[]
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

// ---------------------------------------------------------------------------
// Row (display + inline edit)
// ---------------------------------------------------------------------------

function PantryRow({
  item,
  showCategory = false,
  onUpdated,
  onRemoved,
}: {
  item: PantryItemView
  showCategory?: boolean
  onUpdated: (item: PantryItemView) => void
  onRemoved: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
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

  function handleRemove() {
    // Optimistic remove; re-insert on failure.
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
          className={styles.iconButton}
          onClick={startEdit}
          aria-label={`Edit ${item.ingredient.name}`}
        >
          ✎
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={handleRemove}
          disabled={isPending}
          aria-label={`Remove ${item.ingredient.name}`}
        >
          ✕
        </button>
      </div>
    </li>
  )
}
