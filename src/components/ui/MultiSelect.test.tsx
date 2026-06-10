import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatableMultiSelect, MultiSelect, classNamesConfig } from './MultiSelect'

vi.mock('react-select')
vi.mock('react-select/creatable')

vi.mock('./MultiSelect.module.css', () => ({
  default: {
    control: 'control',
    controlFocused: 'controlFocused',
    valueContainer: 'valueContainer',
    multiValue: 'multiValue',
    multiValueLabel: 'multiValueLabel',
    multiValueRemove: 'multiValueRemove',
    input: 'input',
    placeholder: 'placeholder',
    indicatorsContainer: 'indicatorsContainer',
    dropdownIndicator: 'dropdownIndicator',
    clearIndicator: 'clearIndicator',
    indicatorSeparator: 'indicatorSeparator',
    menu: 'menu',
    menuList: 'menuList',
    option: 'option',
    optionSelected: 'optionSelected',
    optionFocused: 'optionFocused',
    noOptionsMessage: 'noOptionsMessage',
  },
}))

describe('MultiSelect', () => {
  const onChange = vi.fn()
  const options = [
    { label: 'Italian', value: 'italian' },
    { label: 'Weeknight', value: 'weeknight' },
    { label: 'Vegetarian', value: 'vegetarian' },
  ]

  beforeEach(() => {
    onChange.mockReset()
  })

  it('renders selected values, including values missing from options', () => {
    render(
      <MultiSelect
        inputId="tags"
        options={options}
        value={['italian', 'archived']}
        onChange={onChange}
        placeholder="Choose tags"
      />
    )

    expect(screen.getByRole('listbox', { name: 'tags' })).toHaveValue(['italian'])
    expect(screen.getAllByTitle('Italian')[0]).toHaveTextContent('Italian')
    expect(screen.getAllByTitle('archived')[0]).toHaveTextContent('archived')
    expect(screen.getByText('Choose tags')).toBeInTheDocument()
  })

  it('emits selected option values', async () => {
    render(<MultiSelect inputId="tags" options={options} value={[]} onChange={onChange} />)

    await userEvent.selectOptions(screen.getByRole('listbox', { name: 'tags' }), 'weeknight')

    expect(onChange).toHaveBeenCalledWith(['weeknight'])
  })
})

describe('CreatableMultiSelect', () => {
  const onChange = vi.fn()
  const options = [{ label: 'Dinner', value: 'dinner' }]

  beforeEach(() => {
    onChange.mockReset()
  })

  it('emits existing selected option values', async () => {
    render(
      <CreatableMultiSelect inputId="meal-types" options={options} value={[]} onChange={onChange} />
    )

    await userEvent.selectOptions(screen.getByRole('listbox', { name: 'meal-types' }), 'dinner')

    expect(onChange).toHaveBeenCalledWith(['dinner'])
  })

  it('emits created values and uses the create label format', async () => {
    render(
      <CreatableMultiSelect
        inputId="meal-types"
        options={options}
        value={['dinner']}
        onChange={onChange}
      />
    )

    await userEvent.type(screen.getByRole('textbox', { name: 'meal-types input' }), 'Brunch')

    expect(screen.getByText('Add "Brunch"')).toBeInTheDocument()

    await userEvent.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(['dinner', 'Brunch'])
  })
})

describe('classNamesConfig', () => {
  it('control includes focused class only when isFocused is true', () => {
    expect(classNamesConfig.control!({ isFocused: true } as never)).toContain('controlFocused')
    expect(classNamesConfig.control!({ isFocused: false } as never)).not.toContain('controlFocused')
  })

  it('option returns selected class when isSelected', () => {
    expect(classNamesConfig.option!({ isSelected: true, isFocused: false } as never)).toContain('optionSelected')
  })

  it('option returns focused class when isFocused and not selected', () => {
    expect(classNamesConfig.option!({ isSelected: false, isFocused: true } as never)).toContain('optionFocused')
  })

  it('option returns base class when neither focused nor selected', () => {
    const result = classNamesConfig.option!({ isSelected: false, isFocused: false } as never)
    expect(result).not.toContain('optionSelected')
    expect(result).not.toContain('optionFocused')
  })

  it('simple class accessors return a non-empty string', () => {
    const noArgKeys = [
      'valueContainer', 'multiValue', 'multiValueLabel', 'multiValueRemove',
      'input', 'placeholder', 'indicatorsContainer', 'dropdownIndicator',
      'clearIndicator', 'indicatorSeparator', 'menu', 'menuList', 'noOptionsMessage',
    ] as const
    for (const key of noArgKeys) {
      expect(typeof classNamesConfig[key]!({} as never)).toBe('string')
    }
  })
})
