'use client'

import { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { useTitleAvailability } from '@/lib/hooks/useTitleAvailability'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { LIMITS } from '@/lib/schemas/recipe'
import { CharCounter } from '@/components/ui/CharCounter'
import { IngredientsField } from './IngredientsField'
import { StepsField } from './StepsField'
import { MultiSelect, CreatableMultiSelect } from '@/components/ui/MultiSelect'
import { CUISINES } from '@/lib/constants/cuisines'
import { DIETARY_RESTRICTIONS } from '@/lib/constants/dietary-restrictions'
import { COOKING_METHODS } from '@/lib/constants/cooking-methods'
import { useCoverUpload } from './useCoverUpload'
import styles from './GuidedMode.module.css'

type Tab = 'about' | 'details' | 'ingredients' | 'steps' | 'preview'

const TABS: { id: Tab; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'details', label: 'Details' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'steps', label: 'Steps' },
  { id: 'preview', label: 'Preview' },
]

interface GuidedModeProps {
  form: UseFormReturn<RecipeFormValues>
  tags: { id: string; name: string }[]
  ingredientTypes: { id: string; name: string }[]
  recipeId?: string
  coverImageStatus?: 'pending_approval' | 'approved' | 'rejected' | null
  consentGiven: boolean
  onConsentChange: (v: boolean) => void
}

const dietaryOptions = DIETARY_RESTRICTIONS.map((d) => ({ label: d, value: d }))
const cookingMethodOptions = COOKING_METHODS.map((m) => ({ label: m, value: m }))

export function GuidedMode({ form, tags, ingredientTypes, recipeId, coverImageStatus, consentGiven, onConsentChange }: GuidedModeProps) {
  const [activeTab, setActiveTab] = useState<Tab>('about')
  const { register, watch, setValue, formState: { errors } } = form
  const { isUploading, uploadError, fileInputRef, handleCoverUpload } = useCoverUpload(setValue)
  const coverImageUrl = watch('coverImageUrl')

  const cookingMethods = watch('cookingMethods')
  const dietaryRestrictions = watch('dietaryRestrictions')
  const tagIds = watch('tagIds')
  const watchedValues = watch()
  const { taken: titleTaken } = useTitleAvailability(watchedValues.title, recipeId)

  const tagOptions = tags.map((t) => ({ label: t.name, value: t.id }))

  const tabIndex = TABS.findIndex((t) => t.id === activeTab)
  const progress = Math.round(((tabIndex + 1) / TABS.length) * 100)

  const totalMins =
    (parseInt(watchedValues.prepTimeMins) || 0) + (parseInt(watchedValues.cookTimeMins) || 0) || null

  return (
    <div className={styles.wrapper}>
      {/* Progress bar */}
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''} ${i < tabIndex ? styles.tabDone : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className={styles.panel}>

        {/* About tab */}
        {activeTab === 'about' && (
          <div className={styles.fields}>
            <p className={styles.hint}>Start with the basics — what&apos;s the recipe and why should someone make it?</p>

            <div className={styles.aboutGrid}>
              {/* Left: title + description */}
              <div className={styles.aboutMain}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="g-title">
                    Recipe title <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="g-title"
                    {...register('title')}
                    className={styles.input}
                    placeholder="e.g. Classic Bolognese"
                    maxLength={LIMITS.TITLE}
                    data-testid="recipe-title"
                  />
                  <CharCounter value={watchedValues.title} max={LIMITS.TITLE} />
                  {errors.title && <span className={styles.error}>{errors.title.message}</span>}
                  {titleTaken && <span className={styles.warning}>Another recipe with this title exists — yours will get a slightly different URL.</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="g-desc">
                    Description <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="g-desc"
                    {...register('description')}
                    className={styles.textarea}
                    placeholder="A few sentences about this recipe…"
                    rows={5}
                    maxLength={LIMITS.DESCRIPTION}
                    data-testid="recipe-description"
                  />
                  <CharCounter value={watchedValues.description} max={LIMITS.DESCRIPTION} />
                  {errors.description && <span className={styles.error}>{errors.description.message}</span>}
                </div>
              </div>

              {/* Right: cover photo */}
              <div className={styles.field}>
                <label className={styles.label}>Cover photo</label>
                <div className={styles.coverWrapper}>
                  {coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImageUrl} alt="Cover" className={styles.coverPreview} />
                  ) : (
                    <div className={`${styles.coverPlaceholder} ${isUploading ? styles.coverLoading : ''}`}>
                      {isUploading ? '' : 'No photo yet'}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    ref={fileInputRef}
                    onChange={handleCoverUpload}
                    className={styles.fileInput}
                    disabled={!consentGiven}
                  />
                  <label className={styles.consentLabel}>
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => onConsentChange(e.target.checked)}
                    />
                    {' '}I confirm this image is my own and complies with our{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">content guidelines</a>.
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!consentGiven || isUploading}
                    className={`${styles.uploadButton} ${isUploading ? styles.loading : ''}`}
                  >
                    {coverImageUrl ? 'Change photo' : 'Upload photo'}
                  </button>
                  {uploadError && <p className={styles.error}>{uploadError}</p>}
                </div>
                {coverImageStatus === 'pending_approval' && (
                  <p className={styles.imageStatusPending}>
                    Image under review — it will appear publicly once approved.
                  </p>
                )}
                {coverImageStatus === 'rejected' && (
                  <p className={styles.imageStatusRejected}>
                    Image rejected — please upload a different image.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Details tab */}
        {activeTab === 'details' && (
          <div className={styles.fields}>
            <p className={styles.hint}>Optional but helpful — timing, cuisine, dietary info, and tags make your recipe easier to discover.</p>

            <div className={styles.detailsGrid}>
              {/* Timing + cuisine/difficulty span full width */}
              <div className={`${styles.row3} ${styles.detailsGridFull}`}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="g-prep">Prep (min)</label>
                  <input id="g-prep" type="number" min="1" max={LIMITS.TIMING} {...register('prepTimeMins')} className={styles.input} placeholder="15" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="g-cook">Cook (min)</label>
                  <input id="g-cook" type="number" min="1" max={LIMITS.TIMING} {...register('cookTimeMins')} className={styles.input} placeholder="30" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="g-serv">Serves</label>
                  <input id="g-serv" type="number" min="1" max={LIMITS.SERVINGS} {...register('servings')} className={styles.input} placeholder="4" />
                </div>
              </div>

              <div className={`${styles.row2} ${styles.detailsGridFull}`}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="g-cuisine">Cuisine</label>
                  <select id="g-cuisine" {...register('cuisine')} className={styles.select}>
                    <option value="">Select cuisine…</option>
                    {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="g-difficulty">Difficulty</label>
                  <select id="g-difficulty" {...register('difficulty')} className={styles.select}>
                    <option value="">Select difficulty…</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Dietary + Cook style side by side, Tags full width */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="g-dietary">Dietary</label>
                <MultiSelect
                  inputId="g-dietary"
                  options={dietaryOptions}
                  value={dietaryRestrictions ?? []}
                  onChange={(v) => setValue('dietaryRestrictions', v, { shouldDirty: true })}
                  placeholder="e.g. Vegan, Gluten-Free…"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="g-cookingMethods">Cook style</label>
                <CreatableMultiSelect
                  inputId="g-cookingMethods"
                  options={cookingMethodOptions}
                  value={cookingMethods ?? []}
                  onChange={(v) => setValue('cookingMethods', v, { shouldDirty: true })}
                  placeholder="e.g. Sautéed, Baked, Grilled…"
                />
              </div>

              {tags.length > 0 && (
                <div className={`${styles.field} ${styles.detailsGridFull}`}>
                  <label className={styles.label} htmlFor="g-tags">Tags</label>
                  <MultiSelect
                    inputId="g-tags"
                    options={tagOptions}
                    value={tagIds ?? []}
                    onChange={(v) => setValue('tagIds', v, { shouldDirty: true })}
                    placeholder="e.g. Dinner, Weeknight…"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ingredients tab */}
        {activeTab === 'ingredients' && (
          <div className={styles.fields}>
            <p className={styles.hint}>Add your ingredients. You can drag to reorder them.</p>
            <IngredientsField form={form} ingredientTypes={ingredientTypes} />
          </div>
        )}

        {/* Steps tab */}
        {activeTab === 'steps' && (
          <div className={styles.fields}>
            <p className={styles.hint}>Walk cooks through each step. Keep steps focused — one action at a time.</p>
            <StepsField form={form} />
          </div>
        )}

        {/* Preview tab */}
        {activeTab === 'preview' && (
          <div className={styles.preview}>
            <h2 className={styles.previewTitle}>{watchedValues.title || 'Untitled recipe'}</h2>
            {watchedValues.description && <p className={styles.previewDesc}>{watchedValues.description}</p>}
            <div className={styles.previewStats}>
              {totalMins && <span>{totalMins} min</span>}
              {watchedValues.servings && <span>Serves {watchedValues.servings}</span>}
              {watchedValues.cuisine && <span>{watchedValues.cuisine}</span>}
            </div>
            {(watchedValues.ingredients?.length ?? 0) > 0 && (
              <>
                <h3 className={styles.previewSection}>Ingredients</h3>
                <ul className={styles.previewList}>
                  {watchedValues.ingredients.map((ing, i) => (
                    <li key={i}>
                      <strong>{ing.quantity} {ing.unit}</strong> {ing.ingredientName}
                      {ing.preparation ? `, ${ing.preparation}` : ''}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(watchedValues.steps?.length ?? 0) > 0 && (
              <>
                <h3 className={styles.previewSection}>Steps</h3>
                <ol className={styles.previewList}>
                  {watchedValues.steps.map((step, i) => (
                    <li key={i}>{step.content}</li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={styles.navRow}>
        {tabIndex > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab(TABS[tabIndex - 1].id)}
            className={styles.navBack}
          >
            ← {TABS[tabIndex - 1].label}
          </button>
        )}
        {tabIndex < TABS.length - 1 && (
          <button
            type="button"
            onClick={() => setActiveTab(TABS[tabIndex + 1].id)}
            className={styles.navNext}
          >
            {TABS[tabIndex + 1].label} →
          </button>
        )}
      </div>
    </div>
  )
}
