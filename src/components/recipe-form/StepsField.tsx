'use client'

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
import { useFieldArray, useWatch, type UseFormReturn, type Control } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { LIMITS } from '@/lib/schemas/recipe'
import { CharCounter } from '@/components/ui/CharCounter'
import styles from './StepsField.module.css'

interface StepsFieldProps {
  form: UseFormReturn<RecipeFormValues>
}

export function StepsField({ form }: StepsFieldProps) {
  const { control, register, formState: { errors } } = form

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
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
            <SortableStep
              key={field.id}
              id={field.id}
              index={index}
              control={control}
              register={register}
              error={errors.steps?.[index]?.content?.message}
              onRemove={() => remove(index)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => append({ content: '' })}
        className={styles.addButton}
      >
        + Add step
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sortable step row
// ---------------------------------------------------------------------------

interface SortableStepProps {
  id: string
  index: number
  control: Control<RecipeFormValues>
  register: UseFormReturn<RecipeFormValues>['register']
  error?: string
  onRemove: () => void
}

function SortableStep({ id, index, control, register, error, onRemove }: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const content = useWatch({ control, name: `steps.${index}.content` }) ?? ''

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={styles.row}>
      <button
        type="button"
        className={styles.handle}
        aria-label={`Drag step ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <span className={styles.stepNum}>{index + 1}</span>

      <div className={styles.textareaWrapper}>
        <textarea
          {...register(`steps.${index}.content`)}
          className={styles.textarea}
          placeholder={`Step ${index + 1}…`}
          rows={2}
          maxLength={LIMITS.STEP_CONTENT}
          data-testid={`step-${index}-content`}
        />
        <CharCounter value={content} max={LIMITS.STEP_CONTENT} />
        {error && <span className={styles.error}>{error}</span>}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className={styles.removeButton}
        aria-label={`Remove step ${index + 1}`}
      >
        ✕
      </button>
    </div>
  )
}
