'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import type { PantryItemView } from '@/lib/actions/pantry'
import { addPantryItems } from '@/lib/actions/pantry'
import { PANTRY_SECTIONS, sectionIdForTypeSlug } from '@/lib/pantry/common-ingredients'
import { useToast } from '@/lib/toast'
import { PantryIngredientPill } from './PantryIngredientPill'
import { PantryRow } from './PantryRow'
import { PantrySectionAdd } from './PantrySectionAdd'
import styles from './pantry.module.css'

interface IngredientType {
  id: string
  name: string
  slug: string
}

interface PantryCategoryBoardProps {
  items: PantryItemView[]
  ingredientTypes: IngredientType[]
  onUpdated: (item: PantryItemView) => void
  onRemoved: (id: string) => void
}

export function PantryCategoryBoard({
  items,
  ingredientTypes,
  onUpdated,
  onRemoved,
}: PantryCategoryBoardProps) {
  const typeSlugToId = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of ingredientTypes) map.set(t.slug, t.id)
    return map
  }, [ingredientTypes])

  const pantryNames = useMemo(
    () => new Set(items.map((i) => i.ingredient.name)),
    [items]
  )

  const { itemsBySection, uncategorizedItems } = useMemo(() => {
    const bySection = new Map<string, PantryItemView[]>()
    for (const section of PANTRY_SECTIONS) {
      bySection.set(section.id, [])
    }
    const uncategorized: PantryItemView[] = []
    for (const item of items) {
      const sectionId = sectionIdForTypeSlug(item.type.slug)
      if (!sectionId) {
        uncategorized.push(item)
        continue
      }
      const list = bySection.get(sectionId) ?? []
      list.push(item)
      bySection.set(sectionId, list)
    }
    for (const [, list] of bySection) {
      list.sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name))
    }
    uncategorized.sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name))
    return { itemsBySection: bySection, uncategorizedItems: uncategorized }
  }, [items])

  return (
    <div className={styles.sectionBoard}>
      {PANTRY_SECTIONS.map((section) => {
        const primaryTypeId = typeSlugToId.get(section.typeSlugs[0])
        if (!primaryTypeId) return null

        return (
          <SectionCard
            key={section.id}
            section={section}
            typeSlugToId={typeSlugToId}
            pantryNames={pantryNames}
            sectionItems={itemsBySection.get(section.id) ?? []}
            primaryTypeId={primaryTypeId}
            onUpdated={onUpdated}
            onRemoved={onRemoved}
          />
        )
      })}

      {uncategorizedItems.length > 0 && (
        <OtherCard
          items={uncategorizedItems}
          onUpdated={onUpdated}
          onRemoved={onRemoved}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// OtherCard — catch-all for items whose ingredient type isn't mapped to any
// section. Display-only: no Quick-add, no section add form.
// ---------------------------------------------------------------------------

interface OtherCardProps {
  items: PantryItemView[]
  onUpdated: (item: PantryItemView) => void
  onRemoved: (id: string) => void
}

function OtherCard({ items, onUpdated, onRemoved }: OtherCardProps) {
  return (
    <section className={styles.sectionCard} aria-labelledby="pantry-section-other">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle} id="pantry-section-other">
          Other
        </h2>
      </div>
      <ul className={styles.list} role="list">
        {items.map((item) => (
          <PantryRow
            key={item.id}
            item={item}
            onUpdated={onUpdated}
            onRemoved={onRemoved}
          />
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// SectionCard — owns pill selection state and the "more options" modal
// ---------------------------------------------------------------------------

type PantrySection = (typeof PANTRY_SECTIONS)[number]

interface SectionCardProps {
  section: PantrySection
  typeSlugToId: Map<string, string>
  pantryNames: Set<string>
  sectionItems: PantryItemView[]
  primaryTypeId: string
  onUpdated: (item: PantryItemView) => void
  onRemoved: (id: string) => void
}

function SectionCard({
  section,
  typeSlugToId,
  pantryNames,
  sectionItems,
  primaryTypeId,
  onUpdated,
  onRemoved,
}: SectionCardProps) {
  const toast = useToast()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // All quick-add candidates: items + moreItems, excluding what's already in pantry
  const allSource = [...section.items, ...section.moreItems]
  const allAvailable = allSource
    .filter((item) => !pantryNames.has(item.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function buildInputs(names: Set<string>) {
    return [...names].map((name) => {
      const item = allSource.find((i) => i.name === name)!
      return { ingredientName: name, typeId: typeSlugToId.get(item.typeSlug) ?? '' }
    })
  }

  function handleSave() {
    startTransition(async () => {
      const result = await addPantryItems(buildInputs(selected))
      if ('error' in result) { toast.error('Error', result.error); return }
      result.items.forEach(onUpdated)
      setSelected(new Set())
      dialogRef.current?.close()
    })
  }

  function openDialog() {
    setSelected(new Set())
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  return (
    <section
      className={styles.sectionCard}
      aria-labelledby={`pantry-section-${section.id}`}
    >
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle} id={`pantry-section-${section.id}`}>
          {section.label}
        </h2>
        {allAvailable.length > 0 && (
          <button
            type="button"
            className={styles.quickAddBtn}
            onClick={openDialog}
            aria-haspopup="dialog"
          >
            Quick-add
          </button>
        )}
      </div>

      <PantrySectionAdd
        sectionId={section.id}
        typeId={primaryTypeId}
        onAdded={onUpdated}
      />

      {sectionItems.length > 0 && (
        <ul className={styles.list} role="list">
          {sectionItems.map((item) => (
            <PantryRow
              key={item.id}
              item={item}
              onUpdated={onUpdated}
              onRemoved={onRemoved}
            />
          ))}
        </ul>
      )}

      {/* Quick-add dialog */}
      <dialog
        ref={dialogRef}
        className={styles.moreDialog}
        onClose={() => setSelected(new Set())}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog()
        }}
      >
        <div className={styles.moreDialogInner}>
          <div className={styles.moreDialogHeader}>
            <h3 className={styles.moreDialogTitle}>
              Quickly add to {section.label}
            </h3>
            <button
              type="button"
              className={styles.moreDialogClose}
              onClick={closeDialog}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className={styles.moreDialogBody}>
            <div className={styles.pillGrid}>
              {allAvailable.map((item) => (
                <PantryIngredientPill
                  key={item.name}
                  name={item.name}
                  selected={selected.has(item.name)}
                  onToggle={toggle}
                />
              ))}
              {allAvailable.length === 0 && (
                <p className={styles.moreEmpty}>All options already in your pantry.</p>
              )}
            </div>
          </div>

          <div className={styles.moreDialogFooter}>
            {selected.size > 0 ? (
              <>
                <button
                  type="button"
                  className={styles.pillSave}
                  onClick={handleSave}
                  disabled={isPending}
                >
                  {isPending ? 'Adding…' : `Add ${selected.size}`}
                </button>
                <button
                  type="button"
                  className={styles.pillCancel}
                  onClick={() => setSelected(new Set())}
                  disabled={isPending}
                >
                  Clear
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.pillCancel}
                onClick={closeDialog}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </dialog>
    </section>
  )
}
