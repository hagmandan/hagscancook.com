'use client'


import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, FormProvider, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecipeSchema, type RecipeFormValues } from '@/lib/schemas/recipe'
import { createRecipe, updateRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import { tierLabel, badgeLabel, badgeSubtitle } from '@/lib/badges'
import { FormHeader } from './FormHeader'
import { ChefMode } from './ChefMode'
import { GuidedMode } from './GuidedMode'
import styles from './RecipeForm.module.css'

interface RecipeFormProps {
  /** Pre-populated when editing an existing recipe. */
  initialValues?: Partial<RecipeFormValues>
  /** Set when editing — the DB UUID of the recipe being edited. */
  recipeId?: string
  /** The recipe's current status. Defaults to 'draft' for new recipes. */
  initialStatus?: 'draft' | 'published'
  /** Persisted moderation status of the current cover image. Null when no image. */
  coverImageStatus?: 'pending_approval' | 'approved' | 'rejected' | null
  /** All available tags to render in the multi-select. */
  tags: { id: string; name: string }[]
  /** All ingredient types for the per-row type selector. */
  ingredientTypes: { id: string; name: string }[]
}

const DEFAULT_VALUES: RecipeFormValues = {
  title: '',
  description: '',
  coverImageUrl: '',
  prepTimeMins: '',
  cookTimeMins: '',
  servings: '',
  cuisine: '',
  difficulty: '',
  dietaryRestrictions: [],
  cookingMethods: [],
  tagIds: [],
  ingredients: [],
  steps: [],
}

export function RecipeForm({ initialValues, recipeId, initialStatus = 'draft', coverImageStatus, tags, ingredientTypes }: RecipeFormProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const mode = searchParams.get('mode') ?? 'chef'

  const form = useForm<RecipeFormValues>({
    // Cast suppresses the resolver mismatch between the Zod inferred type and
    // the looser RecipeFormValues type (e.g. dietaryRestrictions string[] vs
    // the specific enum union). The Zod schema still validates correctly at
    // runtime; the server actions re-validate anyway.
    resolver: zodResolver(RecipeSchema) as unknown as Resolver<RecipeFormValues>,
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  })

  const { handleSubmit, formState: { isSubmitting } } = form
  const [consentGiven, setConsentGiven] = useState(false)

  async function onSubmit(data: RecipeFormValues, publish: boolean) {
    const result = recipeId
      ? await updateRecipe(recipeId, data, publish)
      : await createRecipe(data, publish)

    if ('error' in result) {
      toast.error('Error', result.error)
      return
    }

    result.newBadges.forEach((b) =>
      toast.success(`${tierLabel(b.tier)} unlocked — ${badgeLabel(b.badgeType)}`, badgeSubtitle(b))
    )

    router.push(`/recipes/${result.slug}`)
  }

  function save() {
    handleSubmit((data) => onSubmit(data, false))()
  }

  function saveAndPublish() {
    handleSubmit((data) => onSubmit(data, true))()
  }

  return (
    <div className={styles.root}>
      <FormHeader
        form={form}
        onSave={save}
        onSaveAndPublish={saveAndPublish}
        isSubmitting={isSubmitting}
        initialStatus={initialStatus}
      />

      <FormProvider {...form}>
        {mode === 'guided' ? (
          <GuidedMode tags={tags} ingredientTypes={ingredientTypes} recipeId={recipeId} coverImageStatus={coverImageStatus} consentGiven={consentGiven} onConsentChange={setConsentGiven} />
        ) : (
          <ChefMode tags={tags} ingredientTypes={ingredientTypes} recipeId={recipeId} coverImageStatus={coverImageStatus} consentGiven={consentGiven} onConsentChange={setConsentGiven} />
        )}
      </FormProvider>
    </div>
  )
}
