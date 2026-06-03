'use client'

/**
 * Chef mode — longform single-scroll layout for power users.
 *
 * All recipe sections are rendered in one continuous scroll:
 * Title → Description → Cover photo → Timing → Cuisine/Diet → Tags →
 * Ingredients → Steps
 *
 * Receives form methods from RecipeForm via props.
 */

import { useRef, type ChangeEvent } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { IngredientsField } from './IngredientsField'
import { StepsField } from './StepsField'
import { PillSelect } from '@/components/ui/PillSelect'
import { CUISINES } from '@/lib/constants/cuisines'
import { DIETARY_RESTRICTIONS } from '@/lib/constants/dietary-restrictions'
import { COOKING_METHODS } from '@/lib/constants/cooking-methods'
import styles from './ChefMode.module.css'

interface ChefModeProps {
  form: UseFormReturn<RecipeFormValues>
  tags: { id: string; name: string }[]
  ingredientTypes: { id: string; name: string }[]
}

export function ChefMode({ form, tags, ingredientTypes }: ChefModeProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverImageUrl = watch('coverImageUrl')
  const selectedDietary = watch('dietaryRestrictions')
  const selectedCookingMethods = watch('cookingMethods')
  const selectedTagIds = watch('tagIds')

  async function handleCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    })
    if (!res.ok) return
    const { uploadUrl, publicUrl } = (await res.json()) as {
      uploadUrl: string
      publicUrl: string
    }
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    setValue('coverImageUrl', publicUrl, { shouldDirty: true })
  }

  function toggleDietary(value: string) {
    const current = selectedDietary ?? []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setValue('dietaryRestrictions', next, { shouldDirty: true })
  }

  function toggleTag(id: string) {
    const current = selectedTagIds ?? []
    const next = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id]
    setValue('tagIds', next, { shouldDirty: true })
  }

  return (
    <div className={styles.form}>
      {/* Title */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input
          id="title"
          {...register('title')}
          className={styles.input}
          placeholder="What's the recipe called?"
          data-testid="recipe-title"
        />
        {errors.title && <span className={styles.error}>{errors.title.message}</span>}
      </div>

      {/* Description */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">Description</label>
        <textarea
          id="description"
          {...register('description')}
          className={styles.textarea}
          placeholder="A short description to entice cooks…"
          rows={3}
          data-testid="recipe-description"
        />
        {errors.description && <span className={styles.error}>{errors.description.message}</span>}
      </div>

      {/* Cover photo */}
      <div className={styles.field}>
        <label className={styles.label}>Cover photo</label>
        <div className={styles.coverWrapper}>
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="Cover preview" className={styles.coverPreview} />
          ) : (
            <div className={styles.coverPlaceholder}>No image selected</div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handleCoverUpload}
            className={styles.fileInput}
            data-testid="cover-upload"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={styles.uploadButton}
          >
            {coverImageUrl ? 'Change photo' : 'Upload photo'}
          </button>
        </div>
      </div>

      {/* Timing + servings */}
      <div className={styles.row3}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="prepTime">Prep time (min)</label>
          <input id="prepTime" type="number" min="1" {...register('prepTimeMins')} className={styles.input} placeholder="15" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cookTime">Cook time (min)</label>
          <input id="cookTime" type="number" min="1" {...register('cookTimeMins')} className={styles.input} placeholder="30" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="servings">Servings</label>
          <input id="servings" type="number" min="1" {...register('servings')} className={styles.input} placeholder="4" />
        </div>
      </div>

      {/* Cuisine + Difficulty side by side */}
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cuisine">Cuisine</label>
          <select id="cuisine" {...register('cuisine')} className={styles.select}>
            <option value="">Select cuisine…</option>
            {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" {...register('difficulty')} className={styles.select}>
            <option value="">Select difficulty…</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Dietary restrictions */}
      <div className={styles.field}>
        <span className={styles.label}>Dietary restrictions</span>
        <div className={styles.chipGroup}>
          {DIETARY_RESTRICTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDietary(d)}
              className={`${styles.chip} ${selectedDietary?.includes(d) ? styles.chipActive : ''}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Cook style */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cookingMethods">Cook style</label>
        <PillSelect
          id="cookingMethods"
          options={[...COOKING_METHODS]}
          value={selectedCookingMethods ?? []}
          onChange={(v) => setValue('cookingMethods', v, { shouldDirty: true })}
          placeholder="e.g. Sautéed, Baked, Grilled…"
          allowCustom
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className={styles.field}>
          <span className={styles.label}>Tags</span>
          <div className={styles.chipGroup}>
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`${styles.chip} ${selectedTagIds?.includes(t.id) ? styles.chipActive : ''}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients */}
      <div className={styles.field}>
        <span className={styles.sectionTitle}>Ingredients</span>
        <IngredientsField form={form} ingredientTypes={ingredientTypes} />
      </div>

      {/* Steps */}
      <div className={styles.field}>
        <span className={styles.sectionTitle}>Steps</span>
        <StepsField form={form} />
      </div>
    </div>
  )
}
