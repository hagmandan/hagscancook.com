'use client'

/**
 * Sticky header rendered inside RecipeForm.
 *
 * Shows the live recipe title (via `watch`), a mode toggle, and Save /
 * Save and Publish action buttons. Must be a Client Component because it reads from
 * React Hook Form state.
 */

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { type UseFormReturn } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import styles from './FormHeader.module.css'

interface FormHeaderProps {
  form: UseFormReturn<RecipeFormValues>
  onSave: () => void
  onSaveAndPublish: () => void
  isSubmitting: boolean
  initialStatus: 'draft' | 'published'
}

export function FormHeader({
  form,
  onSave,
  onSaveAndPublish,
  isSubmitting,
  initialStatus,
}: FormHeaderProps) {
  const title = form.watch('title')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentMode = searchParams.get('mode') ?? 'chef'

  const chefHref = `${pathname}?mode=chef`
  const guidedHref = `${pathname}?mode=guided`

  return (
    <div className={styles.header}>
      <div className={styles.inner}>
        {/* Back */}
        <Link href="/my-recipes" className={styles.back}>
          ← My Recipes
        </Link>

        {/* Live title */}
        <span className={styles.title}>
          {title || <span className={styles.titlePlaceholder}>Untitled recipe</span>}
        </span>

        {/* Mode toggle */}
        <div className={styles.modeToggle} role="group" aria-label="Form mode">
          <Link
            href={chefHref}
            className={`${styles.modeButton} ${currentMode === 'chef' ? styles.modeActive : ''}`}
            aria-current={currentMode === 'chef' ? 'page' : undefined}
          >
            Chef mode
          </Link>
          <Link
            href={guidedHref}
            className={`${styles.modeButton} ${currentMode === 'guided' ? styles.modeActive : ''}`}
            aria-current={currentMode === 'guided' ? 'page' : undefined}
          >
            Guide me
          </Link>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className={`${styles.draftButton} ${isSubmitting ? styles.loading : ''}`}
          >
            Save
          </button>
          {initialStatus === 'draft' && (
            <button
              type="button"
              onClick={onSaveAndPublish}
              disabled={isSubmitting}
              className={`${styles.publishButton} ${isSubmitting ? styles.loading : ''}`}
            >
              Save and Publish
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
