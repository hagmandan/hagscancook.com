import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnitSelect } from './UnitSelect'

vi.mock('./UnitSelect.module.css', () => ({
  default: {
    select: 'select',
    custom: 'custom',
    customInput: 'customInput',
    revert: 'revert',
  },
}))

describe('UnitSelect', () => {
  const onChange = vi.fn()

  beforeEach(() => {
    onChange.mockReset()
  })

  it('renders a select for known unit values', () => {
    render(<UnitSelect value="cup" onChange={onChange} ariaLabel="Unit" data-testid="unit-select" />)

    const select = screen.getByRole('combobox', { name: 'Unit' })
    expect(select).toHaveValue('cup')
    expect(screen.getByTestId('unit-select')).toBe(select)
  })

  it('calls onChange when selecting a known unit', async () => {
    render(<UnitSelect value="" onChange={onChange} ariaLabel="Unit" />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Unit' }), 'tbsp')

    expect(onChange).toHaveBeenCalledWith('tbsp')
  })

  it('enters custom mode when Other is selected', async () => {
    render(<UnitSelect value="" onChange={onChange} ariaLabel="Unit" maxLength={12} data-testid="unit-input" />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Unit' }), '__other__')

    const input = screen.getByRole('textbox', { name: 'Unit' })
    expect(onChange).toHaveBeenCalledWith('')
    expect(input).toHaveAttribute('maxLength', '12')
    expect(screen.getByTestId('unit-input')).toBe(input)
  })

  it('starts in custom mode for unknown unit values', () => {
    render(<UnitSelect value="knob" onChange={onChange} ariaLabel="Unit" />)

    expect(screen.getByRole('textbox', { name: 'Unit' })).toHaveValue('knob')
    expect(screen.getByRole('button', { name: 'Choose unit from list' })).toBeInTheDocument()
  })

  it('updates custom unit values', async () => {
    render(<UnitSelect value="knob" onChange={onChange} ariaLabel="Unit" />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Unit' }), 's')

    expect(onChange).toHaveBeenLastCalledWith('knobs')
  })

  it('reverts from custom mode to the select', async () => {
    render(<UnitSelect value="knob" onChange={onChange} ariaLabel="Unit" />)

    await userEvent.click(screen.getByRole('button', { name: 'Choose unit from list' }))

    expect(onChange).toHaveBeenCalledWith('')
    expect(screen.getByRole('combobox', { name: 'Unit' })).toHaveValue('')
  })
})
