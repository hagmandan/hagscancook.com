'use client'

/**
 * Ingredients drag-and-drop field for the recipe form.
 *
 * Each row captures: ingredient name, quantity, unit, preparation note,
 * and an optional group label. Rows are reorderable via dnd-kit.
 *
 * @param form - React Hook Form methods passed down from RecipeForm
 */

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { LIMITS } from '@/lib/schemas/recipe'
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
  const { control, register, formState: { errors } } = form

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'ingredients',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex)
  }

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field, index) => (
            <SortableIngredientRow
              key={field.id}
              id={field.id}
              index={index}
              register={register}
              errors={errors}
              onRemove={() => remove(index)}
              ingredientTypes={ingredientTypes}
            />
          ))}
        </SortableContext>
      </DndContext>

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
  register: UseFormReturn<RecipeFormValues>['register']
  errors: UseFormReturn<RecipeFormValues>['formState']['errors']
  onRemove: () => void
  ingredientTypes: { id: string; name: string }[]
}

function SortableIngredientRow({
  id,
  index,
  register,
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

      <input
        {...register(`ingredients.${index}.unit`)}
        placeholder="cloves"
        className={`${styles.input} ${styles.unitInput}`}
        maxLength={LIMITS.INGREDIENT_UNIT}
        data-testid={`ingredient-${index}-unit`}
      />

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
