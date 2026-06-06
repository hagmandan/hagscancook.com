'use client'

import { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { useCoverUpload } from './useCoverUpload'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { LIMITS } from '@/lib/schemas/recipe'
import { CharCounter } from '@/components/ui/CharCounter'
import { IngredientsField } from './IngredientsField'
import { StepsField } from './StepsField'
import { MultiSelect, CreatableMultiSelect } from '@/components/ui/MultiSelect'
import { CUISINES } from '@/lib/constants/cuisines'
import { DIETARY_RESTRICTIONS } from '@/lib/constants/dietary-restrictions'
import { COOKING_METHODS } from '@/lib/constants/cooking-methods'
import styles from './ChefMode.module.css'

interface ChefModeProps {
  form: UseFormReturn<RecipeFormValues>
  tags: { id: string; name: string }[]
  ingredientTypes: { id: string; name: string }[]
}

const dietaryOptions = DIETARY_RESTRICTIONS.map((d) => ({ label: d, value: d }))
const cookingMethodOptions = COOKING_METHODS.map((m) => ({ label: m, value: m }))

export function ChefMode({ form, tags, ingredientTypes }: ChefModeProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isUploading, fileInputRef, handleCoverUpload } = useCoverUpload(setValue)

  const title = watch('title')
  const description = watch('description')
  const coverImageUrl = watch('coverImageUrl')
  const cookingMethods = watch('cookingMethods')
  const dietaryRestrictions = watch('dietaryRestrictions')
  const tagIds = watch('tagIds')

  const tagOptions = tags.map((t) => ({ label: t.name, value: t.id }))

  return (
    <div className={styles.layout}>

      {/* ── Main column: About + Ingredients + Steps ─────────── */}
      <div className={styles.main}>

        {/* About */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>About</h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">Title</label>
            <input
              id="title"
              {...register('title')}
              className={styles.input}
              placeholder="What's the recipe called?"
              maxLength={LIMITS.TITLE}
              data-testid="recipe-title"
            />
            <CharCounter value={title} max={LIMITS.TITLE} />
            {errors.title && <span className={styles.error}>{errors.title.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">Description</label>
            <textarea
              id="description"
              {...register('description')}
              className={styles.textarea}
              placeholder="A short description to entice cooks…"
              rows={3}
              maxLength={LIMITS.DESCRIPTION}
              data-testid="recipe-description"
            />
            <CharCounter value={description} max={LIMITS.DESCRIPTION} />
            {errors.description && <span className={styles.error}>{errors.description.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Cover photo</label>
            <div className={styles.coverWrapper}>
              {coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImageUrl} alt="Cover preview" className={styles.coverPreview} />
              ) : (
                <div className={`${styles.coverPlaceholder} ${isUploading ? styles.coverLoading : ''}`}>
                  {isUploading ? '' : 'No image selected'}
                </div>
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
                disabled={isUploading}
                className={`${styles.uploadButton} ${isUploading ? styles.loading : ''}`}
              >
                {coverImageUrl ? 'Change photo' : 'Upload photo'}
              </button>
            </div>
          </div>
        </section>

        {/* Ingredients */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Ingredients</h2>
          <IngredientsField form={form} ingredientTypes={ingredientTypes} />
        </section>

        {/* Steps */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Steps</h2>
          <StepsField form={form} />
        </section>
      </div>

      {/* ── Details sidebar ──────────────────────────────────── */}
      <aside className={styles.sidebar}>
        {/* Mobile toggle; hidden on desktop */}
        <button
          type="button"
          className={styles.sidebarToggle}
          onClick={() => setSidebarOpen((o) => !o)}
          aria-expanded={sidebarOpen}
        >
          Details
        </button>

        <div className={`${styles.sidebarContent} ${sidebarOpen ? styles.sidebarContentOpen : ''}`}>
          {/* Desktop heading; hidden on mobile (toggle serves as heading) */}
          <h3 className={styles.sidebarHeading}>Details</h3>

          {/* Timing — short labels so they don't wrap in the narrow columns */}
          <div className={styles.row3}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prepTime">Prep</label>
              <input id="prepTime" type="number" min="1" max={LIMITS.TIMING} {...register('prepTimeMins')} className={styles.input} placeholder="15" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cookTime">Cook</label>
              <input id="cookTime" type="number" min="1" max={LIMITS.TIMING} {...register('cookTimeMins')} className={styles.input} placeholder="30" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="servings">Serves</label>
              <input id="servings" type="number" min="1" max={LIMITS.SERVINGS} {...register('servings')} className={styles.input} placeholder="4" />
            </div>
          </div>

          {/* Cuisine + Difficulty */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cuisine">Cuisine</label>
              <select id="cuisine" {...register('cuisine')} className={styles.select}>
                <option value="">—</option>
                {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="difficulty">Difficulty</label>
              <select id="difficulty" {...register('difficulty')} className={styles.select}>
                <option value="">—</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Dietary restrictions */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="dietary">Dietary</label>
            <MultiSelect
              inputId="dietary"
              options={dietaryOptions}
              value={dietaryRestrictions ?? []}
              onChange={(v) => setValue('dietaryRestrictions', v, { shouldDirty: true })}
              placeholder="e.g. Vegan, Gluten-Free…"
            />
          </div>

          {/* Cook style */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cookingMethods">Cook style</label>
            <CreatableMultiSelect
              inputId="cookingMethods"
              options={cookingMethodOptions}
              value={cookingMethods ?? []}
              onChange={(v) => setValue('cookingMethods', v, { shouldDirty: true })}
              placeholder="e.g. Baked, Grilled…"
            />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tags">Tags</label>
              <MultiSelect
                inputId="tags"
                options={tagOptions}
                value={tagIds ?? []}
                onChange={(v) => setValue('tagIds', v, { shouldDirty: true })}
                placeholder="e.g. Dinner, Weeknight…"
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
