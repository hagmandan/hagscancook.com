import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
// @ts-expect-error — test helpers added to the manual mock
import { simulateDragEnd } from '@dnd-kit/core'
// @ts-expect-error — test helpers added to the manual mock
import { getSortableItems } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider } from 'react-hook-form'
import { StepsField } from './StepsField'
import type { RecipeFormValues } from '@/lib/schemas/recipe'

vi.mock('@dnd-kit/core')
vi.mock('@dnd-kit/sortable')
vi.mock('@dnd-kit/utilities')

vi.mock('./StepsField.module.css', () => ({
  default: {
    root: 'root',
    list: 'list',
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
    <FormProvider {...form}>
      <button
        type="button"
        onClick={() => form.setError('steps.0.content', { message: 'Step content is required' })}
      >
        set error
      </button>
      <StepsField />
    </FormProvider>
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

  it('reorders steps when drag ends on a different target', () => {
    render(<TestStepsField defaultSteps={[{ content: 'Step A' }, { content: 'Step B' }]} />)

    const [firstId, secondId] = getSortableItems()

    act(() => {
      simulateDragEnd({ active: { id: firstId }, over: { id: secondId } } as DragEndEvent)
    })

    const textareas = screen.getAllByRole('textbox')
    expect(textareas[0]).toHaveValue('Step B')
    expect(textareas[1]).toHaveValue('Step A')
  })

  it('does not reorder when dropped on the same step', () => {
    render(<TestStepsField defaultSteps={[{ content: 'Step A' }, { content: 'Step B' }]} />)

    const [firstId] = getSortableItems()

    act(() => {
      simulateDragEnd({ active: { id: firstId }, over: { id: firstId } } as DragEndEvent)
    })

    const textareas = screen.getAllByRole('textbox')
    expect(textareas[0]).toHaveValue('Step A')
    expect(textareas[1]).toHaveValue('Step B')
  })
})
