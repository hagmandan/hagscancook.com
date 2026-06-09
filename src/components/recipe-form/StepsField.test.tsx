import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { StepsField } from './StepsField'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import type { ReactNode } from 'react'

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  })),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => undefined) } },
}))

vi.mock('./StepsField.module.css', () => ({
  default: {
    root: 'root',
    row: 'row',
    handle: 'handle',
    stepNum: 'stepNum',
    textareaWrapper: 'textareaWrapper',
    textarea: 'textarea',
    error: 'error',
    removeButton: 'removeButton',
    addButton: 'addButton',
  },
}))

vi.mock('@/components/ui/CharCounter.module.css', () => ({
  default: { counter: 'counter', near: 'near', over: 'over' },
}))

function TestStepsField({
  defaultSteps = [],
}: {
  defaultSteps?: RecipeFormValues['steps']
}) {
  const form = useForm<RecipeFormValues>({
    defaultValues: { steps: defaultSteps },
  })

  return (
    <>
      <button
        type="button"
        onClick={() => form.setError('steps.0.content', { message: 'Step content is required' })}
      >
        set error
      </button>
      <StepsField form={form} />
    </>
  )
}

describe('StepsField', () => {
  it('appends a blank step row', async () => {
    render(<TestStepsField />)

    await userEvent.click(screen.getByRole('button', { name: '+ Add step' }))

    expect(screen.getByTestId('step-0-content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove step 1' })).toBeInTheDocument()
  })

  it('removes a step row', async () => {
    render(<TestStepsField defaultSteps={[{ content: 'Boil water' }]} />)

    expect(screen.getByDisplayValue('Boil water')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove step 1' }))

    expect(screen.queryByDisplayValue('Boil water')).not.toBeInTheDocument()
  })

  it('shows validation errors for a row', async () => {
    render(<TestStepsField defaultSteps={[{ content: '' }]} />)

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'set error' }))
    })

    expect(screen.getByText('Step content is required')).toBeInTheDocument()
  })
})
