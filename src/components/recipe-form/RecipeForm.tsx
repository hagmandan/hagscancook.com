'use client'

/**
 * Root recipe form component.
 *
 * Owns the single `useForm()` instance shared by ChefMode and GuidedMode.
 * Mode is controlled by the `mode` URL query param — switching modes is a
 * layout change only, never a form reset (shouldUnregister defaults to false
 * in React Hook Form v7, so unmounted fields keep their values).
 *
 * Used by both /recipes/new (no initialValues) and /recipes/[slug]/edit
 * (initialValues populated from the DB).
 */

import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecipeSchema, type RecipeFormValues } from '@/lib/schemas/recipe'
import { createRecipe, updateRecipe } from '@/lib/actions/recipes'
import { FormHeader } from './FormHeader'
import { ChefMode } from './ChefMode'
import { GuidedMode } from './GuidedMode'
import styles from './RecipeForm.module.css'

interface RecipeFormProps {
  /** Pre-populated when editing an existing recipe. */
  initialValues?: Partial<RecipeFormValues>
  /** Set when editing — the DB UUID of the recipe being edited. */
  recipeId?: string
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

export function RecipeForm({ initialValues, recipeId, tags, ingredientTypes }: RecipeFormProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
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

  async function onSubmit(data: RecipeFormValues, publish: boolean) {
    const result = recipeId
      ? await updateRecipe(recipeId, data, publish)
      : await createRecipe(data, publish)

    if ('error' in result) {
      // TODO: surface error via a toast/banner in a future iteration
      alert(result.error)
      return
    }

    router.push(`/recipes/${result.slug}`)
  }

  function saveDraft() {
    handleSubmit((data) => onSubmit(data, false))()
  }

  function publish() {
    handleSubmit((data) => onSubmit(data, true))()
  }

  return (
    <div className={styles.root}>
      <FormHeader
        form={form}
        onSaveDraft={saveDraft}
        onPublish={publish}
        isSubmitting={isSubmitting}
      />

      {mode === 'guided' ? (
        <GuidedMode form={form} tags={tags} ingredientTypes={ingredientTypes} />
      ) : (
        <ChefMode form={form} tags={tags} ingredientTypes={ingredientTypes} />
      )}
    </div>
  )
}
