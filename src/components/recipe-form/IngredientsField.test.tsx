import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { IngredientsField } from './IngredientsField'
import type { RecipeFormValues } from '@/lib/schemas/recipe'

vi.mock('@dnd-kit/core')
vi.mock('@dnd-kit/sortable')
vi.mock('@dnd-kit/utilities')

vi.mock('./IngredientsField.module.css', () => ({
  default: {
    root: 'root',
    columnLabels: 'columnLabels',
    label: 'label',
    requiredMark: 'requiredMark',
    labelOptional: 'labelOptional',
    row: 'row',
    handle: 'handle',
    nameCell: 'nameCell',
    input: 'input',
    nameInput: 'nameInput',
    qtyInput: 'qtyInput',
    prepInput: 'prepInput',
    groupInput: 'groupInput',
    typeSelect: 'typeSelect',
    removeButton: 'removeButton',
    rowErrors: 'rowErrors',
    error: 'error',
    addButton: 'addButton',
  },
}))

vi.mock('@/components/ui/UnitSelect.module.css', () => ({
  default: {
    select: 'select',
    custom: 'custom',
    customInput: 'customInput',
    revert: 'revert',
  },
}))

const ingredientTypes = [
  { id: 'type-produce', name: 'Produce' },
  { id: 'type-baking', name: 'Baking' },
]

const defaultIngredient: RecipeFormValues['ingredients'][number] = {
  ingredientName: 'flour',
  quantity: '2',
  unit: 'cup',
  preparation: 'sifted',
  groupLabel: 'Cake',
  typeId: 'type-baking',
}

function TestIngredientsField({
  defaultIngredients = [],
}: {
  defaultIngredients?: RecipeFormValues['ingredients']
}) {
  const form = useForm<RecipeFormValues>({
    defaultValues: { ingredients: defaultIngredients },
  })

  return (
    <>
      <button
        type="button"
        onClick={() => {
          form.setError('ingredients.0.ingredientName', { message: 'Ingredient name is required' })
          form.setError('ingredients.0.quantity', { message: 'Quantity is required' })
        }}
      >
        set errors
      </button>
      <IngredientsField form={form} ingredientTypes={ingredientTypes} />
    </>
  )
}

describe('IngredientsField', () => {
  it('appends a blank ingredient row', async () => {
    render(<TestIngredientsField />)

    await userEvent.click(screen.getByRole('button', { name: '+ Add ingredient' }))

    expect(screen.getByTestId('ingredient-0-name')).toBeInTheDocument()
    expect(screen.getByTestId('ingredient-0-qty')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove ingredient 1' })).toBeInTheDocument()
  })

  it('renders existing ingredient values and type options', () => {
    render(<TestIngredientsField defaultIngredients={[defaultIngredient]} />)

    expect(screen.getByDisplayValue('flour')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('sifted')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cake')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Ingredient type for row 1' })).toHaveValue('type-baking')
  })

  it('removes an ingredient row', async () => {
    render(<TestIngredientsField defaultIngredients={[defaultIngredient]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Remove ingredient 1' }))

    expect(screen.queryByDisplayValue('flour')).not.toBeInTheDocument()
  })

  it('shows row validation errors', async () => {
    render(<TestIngredientsField defaultIngredients={[{ ...defaultIngredient, ingredientName: '', quantity: '' }]} />)

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'set errors' }))
    })

    expect(screen.getByText('Ingredient name is required')).toBeInTheDocument()
    expect(screen.getByText('Quantity is required')).toBeInTheDocument()
  })
})
