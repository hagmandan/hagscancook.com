'use client'

/**
 * Ingredients drag-and-drop field for the recipe form.
 *
 * Each row captures: ingredient name, quantity, unit, preparation note,
 * and an optional group label. Rows are reorderable via dnd-kit.
 *
 * @param form - React Hook Form methods passed down from RecipeForm
 */

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableList } from './SortableList'
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { LIMITS } from '@/lib/schemas/recipe'
import { UnitSelect } from '@/components/ui/UnitSelect'
import styles from './IngredientsField.module.css'

interface IngredientsFieldProps {
  form: UseFormReturn<RecipeFormValues>
  ingredientTypes: { id: string; name: string }[]
}

const DEFAULT_INGREDIENT = {
  ingredientName: '',
  quantity: '',
  unit: '',
  preparation: '',
  groupLabel: '',
  typeId: '',
}

export function IngredientsField({ form, ingredientTypes }: IngredientsFieldProps) {
  const { control, register, setValue, formState: { errors } } = form

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'ingredients',
  })

  return (
    <div className={styles.root}>
      {fields.length > 0 && (
        <div className={styles.columnLabels} aria-hidden>
          <span />
          <span className={styles.label}>
            Ingredient<span className={styles.requiredMark}>*</span>
          </span>
          <span className={styles.label}>
            Qty<span className={styles.requiredMark}>*</span>
          </span>
          <span className={`${styles.label} ${styles.labelOptional}`}>Unit</span>
          <span className={`${styles.label} ${styles.labelOptional}`}>Prep</span>
          <span className={`${styles.label} ${styles.labelOptional}`}>Group</span>
          <span className={`${styles.label} ${styles.labelOptional}`}>Type</span>
          <span />
        </div>
      )}

      <SortableList fields={fields} onMove={move}>
        {fields.map((field, index) => (
          <SortableIngredientRow
            key={field.id}
            id={field.id}
            index={index}
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            onRemove={() => remove(index)}
            ingredientTypes={ingredientTypes}
          />
        ))}
      </SortableList>

      <button
        type="button"
        onClick={() => append(DEFAULT_INGREDIENT)}
        className={styles.addButton}
      >
        + Add ingredient
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sortable ingredient row
// ---------------------------------------------------------------------------

interface SortableIngredientRowProps {
  id: string
  index: number
  control: UseFormReturn<RecipeFormValues>['control']
  register: UseFormReturn<RecipeFormValues>['register']
  setValue: UseFormReturn<RecipeFormValues>['setValue']
  errors: UseFormReturn<RecipeFormValues>['formState']['errors']
  onRemove: () => void
  ingredientTypes: { id: string; name: string }[]
}

function SortableIngredientRow({
  id,
  index,
  control,
  register,
  setValue,
  errors,
  onRemove,
  ingredientTypes,
}: SortableIngredientRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const rowErrors = errors.ingredients?.[index]

  return (
    <div ref={setNodeRef} style={style} className={styles.row}>
      <button
        type="button"
        className={styles.handle}
        aria-label={`Drag ingredient ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <div className={styles.nameCell}>
        <input
          {...register(`ingredients.${index}.ingredientName`)}
          placeholder="e.g. garlic"
          className={`${styles.input} ${styles.nameInput}`}
          maxLength={LIMITS.INGREDIENT_NAME}
          data-testid={`ingredient-${index}-name`}
        />
      </div>

      <input
        {...register(`ingredients.${index}.quantity`)}
        placeholder="3"
        className={`${styles.input} ${styles.qtyInput}`}
        maxLength={LIMITS.INGREDIENT_QTY}
        data-testid={`ingredient-${index}-qty`}
      />

      <UnitCell index={index} control={control} setValue={setValue} />

      <input
        {...register(`ingredients.${index}.preparation`)}
        placeholder="minced"
        className={`${styles.input} ${styles.prepInput}`}
        maxLength={LIMITS.INGREDIENT_PREP}
        data-testid={`ingredient-${index}-prep`}
      />

      <input
        {...register(`ingredients.${index}.groupLabel`)}
        placeholder="For the sauce"
        className={`${styles.input} ${styles.groupInput}`}
        maxLength={LIMITS.INGREDIENT_GROUP}
        data-testid={`ingredient-${index}-group`}
      />

      {ingredientTypes.length > 0 ? (
        <select
          {...register(`ingredients.${index}.typeId`)}
          className={styles.typeSelect}
          aria-label={`Ingredient type for row ${index + 1}`}
        >
          <option value="">— type —</option>
          {ingredientTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      ) : <span />}

      <button
        type="button"
        onClick={onRemove}
        className={styles.removeButton}
        aria-label={`Remove ingredient ${index + 1}`}
      >
        ✕
      </button>

      {/* Validation errors shown below the row */}
      {rowErrors && (
        <div className={styles.rowErrors}>
          {rowErrors.ingredientName?.message && (
            <span className={styles.error}>{rowErrors.ingredientName.message}</span>
          )}
          {rowErrors.quantity?.message && (
            <span className={styles.error}>{rowErrors.quantity.message}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Unit cell — wires the shared UnitSelect to the RHF field
// ---------------------------------------------------------------------------

interface UnitCellProps {
  index: number
  control: UseFormReturn<RecipeFormValues>['control']
  setValue: UseFormReturn<RecipeFormValues>['setValue']
}

function UnitCell({ index, control, setValue }: UnitCellProps) {
  const name = `ingredients.${index}.unit` as const
  const value = useWatch({ control, name })

  return (
    <UnitSelect
      value={value ?? ''}
      onChange={(v) => setValue(name, v, { shouldDirty: true })}
      ariaLabel={`Unit for ingredient ${index + 1}`}
      maxLength={LIMITS.INGREDIENT_UNIT}
      data-testid={`ingredient-${index}-unit`}
    />
  )
}
