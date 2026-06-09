import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PillSelect } from './PillSelect'

vi.mock('./PillSelect.module.css', () => ({
  default: {
    root: 'root',
    field: 'field',
    pill: 'pill',
    pillRemove: 'pillRemove',
    input: 'input',
    dropdown: 'dropdown',
    option: 'option',
    optionCustom: 'optionCustom',
    highlight: 'highlight',
  },
}))

describe('PillSelect', () => {
  const onChange = vi.fn()
  const options = ['Basil', 'Black pepper', 'Lemon', 'Parsley']

  beforeEach(() => {
    onChange.mockReset()
  })

  it('renders selected pills and hides selected options from suggestions', async () => {
    render(
      <PillSelect
        options={options}
        value={['Basil']}
        onChange={onChange}
        placeholder="Add herbs"
      />
    )

    expect(screen.getByText('Basil')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('textbox'))

    expect(screen.queryByRole('option', { name: 'Basil' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Black pepper' })).toBeInTheDocument()
  })

  it('adds the first filtered option on Enter', async () => {
    render(<PillSelect options={options} value={[]} onChange={onChange} />)

    await userEvent.type(screen.getByRole('textbox'), 'lem{Enter}')

    expect(onChange).toHaveBeenCalledWith(['Lemon'])
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('adds custom values when enabled', async () => {
    render(<PillSelect options={options} value={[]} onChange={onChange} allowCustom />)

    await userEvent.type(screen.getByRole('textbox'), 'Aleppo pepper,')

    expect(onChange).toHaveBeenCalledWith(['Aleppo pepper'])
  })

  it('removes pills by button and backspace', async () => {
    const { rerender } = render(
      <PillSelect options={options} value={['Basil', 'Lemon']} onChange={onChange} />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Remove Basil' }))

    expect(onChange).toHaveBeenCalledWith(['Lemon'])

    rerender(<PillSelect options={options} value={['Basil', 'Lemon']} onChange={onChange} />)

    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.keyboard('{Backspace}')

    expect(onChange).toHaveBeenLastCalledWith(['Basil'])
  })

  it('closes suggestions on escape and outside click', async () => {
    render(<PillSelect options={options} value={[]} onChange={onChange} />)

    await userEvent.click(screen.getByRole('textbox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox'), 'ba')
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await userEvent.click(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
