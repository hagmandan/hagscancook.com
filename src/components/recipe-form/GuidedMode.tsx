'use client'

/**
 * Guided mode — tabbed layout for first-time recipe authors.
 *
 * Tabs: Info → Ingredients → Steps → Preview
 * Tab state is held in local component state (no URL param needed).
 * All field values are preserved across tab switches because shouldUnregister
 * defaults to false in React Hook Form v7.
 */

import { useState, useRef, type ChangeEvent } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { IngredientsField } from './IngredientsField'
import { StepsField } from './StepsField'
import { PillSelect } from '@/components/ui/PillSelect'
import { CUISINES } from '@/lib/constants/cuisines'
import { DIETARY_RESTRICTIONS } from '@/lib/constants/dietary-restrictions'
import { COOKING_METHODS } from '@/lib/constants/cooking-methods'
import styles from './GuidedMode.module.css'

type Tab = 'info' | 'ingredients' | 'steps' | 'preview'

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'steps', label: 'Steps' },
  { id: 'preview', label: 'Preview' },
]

interface GuidedModeProps {
  form: UseFormReturn<RecipeFormValues>
  tags: { id: string; name: string }[]
  ingredientTypes: { id: string; name: string }[]
}

export function GuidedMode({ form, tags, ingredientTypes }: GuidedModeProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const { register, watch, setValue, formState: { errors } } = form
  const fileInputRef = useRef<HTMLInputElement>(null)

  const coverImageUrl = watch('coverImageUrl')
  const selectedDietary = watch('dietaryRestrictions')
  const selectedCookingMethods = watch('cookingMethods')
  const selectedTagIds = watch('tagIds')
  const watchedValues = watch()

  const tabIndex = TABS.findIndex((t) => t.id === activeTab)
  const progress = Math.round(((tabIndex + 1) / TABS.length) * 100)

  async function handleCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    })
    if (!res.ok) return
    const { uploadUrl, publicUrl } = (await res.json()) as { uploadUrl: string; publicUrl: string }
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    setValue('coverImageUrl', publicUrl, { shouldDirty: true })
  }

  function toggleDietary(value: string) {
    const current = selectedDietary ?? []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setValue('dietaryRestrictions', next, { shouldDirty: true })
  }

  function toggleTag(id: string) {
    const current = selectedTagIds ?? []
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
    setValue('tagIds', next, { shouldDirty: true })
  }

  const totalMins =
    (parseInt(watchedValues.prepTimeMins) || 0) + (parseInt(watchedValues.cookTimeMins) || 0) || null

  return (
    <div className={styles.wrapper}>
      {/* Progress bar */}
      <div className={styles.progressBar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
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

        {/* Info tab */}
        {activeTab === 'info' && (
          <div className={styles.fields}>
            <p className={styles.hint}>Let&apos;s start with the basics. Fill in the recipe title and a short description.</p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="g-title">Recipe title <span className={styles.required}>*</span></label>
              <input id="g-title" {...register('title')} className={styles.input} placeholder="e.g. Classic Bolognese" data-testid="recipe-title" />
              {errors.title && <span className={styles.error}>{errors.title.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="g-desc">Description <span className={styles.required}>*</span></label>
              <textarea id="g-desc" {...register('description')} className={styles.textarea} placeholder="A few sentences about this recipe…" rows={3} data-testid="recipe-description" />
              {errors.description && <span className={styles.error}>{errors.description.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cover photo</label>
              <div className={styles.coverWrapper}>
                {coverImageUrl
                  ? <img src={coverImageUrl} alt="Cover" className={styles.coverPreview} /> // eslint-disable-line @next/next/no-img-element
                  : <div className={styles.coverPlaceholder}>No photo yet</div>}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleCoverUpload} className={styles.fileInput} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.uploadButton}>
                  {coverImageUrl ? 'Change photo' : 'Upload photo'}
                </button>
              </div>
            </div>

            <div className={styles.row3}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="g-prep">Prep (min)</label>
                <input id="g-prep" type="number" min="1" {...register('prepTimeMins')} className={styles.input} placeholder="15" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="g-cook">Cook (min)</label>
                <input id="g-cook" type="number" min="1" {...register('cookTimeMins')} className={styles.input} placeholder="30" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="g-serv">Serves</label>
                <input id="g-serv" type="number" min="1" {...register('servings')} className={styles.input} placeholder="4" />
              </div>
            </div>

            <div className={styles.row2}>
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

            <div className={styles.field}>
              <span className={styles.label}>Dietary</span>
              <div className={styles.chipGroup}>
                {DIETARY_RESTRICTIONS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDietary(d)}
                    className={`${styles.chip} ${selectedDietary?.includes(d) ? styles.chipActive : ''}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="g-cookingMethods">Cook style</label>
              <PillSelect
                id="g-cookingMethods"
                options={[...COOKING_METHODS]}
                value={selectedCookingMethods ?? []}
                onChange={(v) => setValue('cookingMethods', v, { shouldDirty: true })}
                placeholder="e.g. Sautéed, Baked, Grilled…"
                allowCustom
              />
            </div>

            {tags.length > 0 && (
              <div className={styles.field}>
                <span className={styles.label}>Tags</span>
                <div className={styles.chipGroup}>
                  {tags.map((t) => (
                    <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                      className={`${styles.chip} ${selectedTagIds?.includes(t.id) ? styles.chipActive : ''}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                    <li key={i}><strong>{ing.quantity} {ing.unit}</strong> {ing.ingredientName}{ing.preparation ? `, ${ing.preparation}` : ''}</li>
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

      {/* Next / Prev navigation */}
      <div className={styles.navRow}>
        {tabIndex > 0 && (
          <button type="button" onClick={() => setActiveTab(TABS[tabIndex - 1].id)} className={styles.navBack}>
            ← {TABS[tabIndex - 1].label}
          </button>
        )}
        {tabIndex < TABS.length - 1 && (
          <button type="button" onClick={() => setActiveTab(TABS[tabIndex + 1].id)} className={styles.navNext}>
            {TABS[tabIndex + 1].label} →
          </button>
        )}
      </div>
    </div>
  )
}
