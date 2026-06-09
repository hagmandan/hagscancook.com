import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatableMultiSelect, MultiSelect } from './MultiSelect'

vi.mock('react-select', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  type Option = { label: string; value: string }
  type MultiValueLabelProps = { data: Option; children: React.ReactNode }
  type SelectProps = {
    inputId?: string
    options: Option[]
    value: Option[]
    onChange: (value: Option[]) => void
    placeholder?: string
    components?: {
      MultiValueLabel?: (props: MultiValueLabelProps) => React.ReactNode
    }
  }

  function MockMultiValueLabel({ children }: MultiValueLabelProps) {
    return React.createElement(React.Fragment, null, children)
  }

  function MockSelect({ inputId, options, value, onChange, placeholder, components }: SelectProps) {
    const Label = components?.MultiValueLabel ?? MockMultiValueLabel

    return React.createElement(
      'div',
      null,
      React.createElement(
        'select',
        {
          'aria-label': inputId ?? 'multi-select',
          id: inputId,
          multiple: true,
          value: value.map((option) => option.value),
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedValues = Array.from(event.currentTarget.selectedOptions).map(
              (option) => option.value
            )
            onChange(options.filter((option) => selectedValues.includes(option.value)))
          },
        },
        options.map((option) =>
          React.createElement('option', { key: option.value, value: option.value }, option.label)
        )
      ),
      value.map((option) =>
        React.createElement(
          'span',
          { key: option.value, title: option.label },
          Label({ data: option, children: option.label })
        )
      ),
      React.createElement('span', null, placeholder)
    )
  }

  return {
    default: MockSelect,
    components: {
      MultiValueLabel: MockMultiValueLabel,
    },
  }
})

vi.mock('react-select/creatable', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  type Option = { label: string; value: string }
  type CreatableProps = {
    inputId?: string
    options: Option[]
    value: Option[]
    onChange: (value: Option[]) => void
    placeholder?: string
    formatCreateLabel: (input: string) => string
  }

  function MockCreatableSelect({
    inputId,
    options,
    value,
    onChange,
    placeholder,
    formatCreateLabel,
  }: CreatableProps) {
    const [inputValue, setInputValue] = React.useState('')
    const createLabel = inputValue ? formatCreateLabel(inputValue) : placeholder

    return React.createElement(
      'div',
      null,
      React.createElement(
        'select',
        {
          'aria-label': inputId ?? 'creatable-select',
          id: inputId,
          multiple: true,
          value: value.map((option) => option.value),
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedValues = Array.from(event.currentTarget.selectedOptions).map(
              (option) => option.value
            )
            onChange(options.filter((option) => selectedValues.includes(option.value)))
          },
        },
        options.map((option) =>
          React.createElement('option', { key: option.value, value: option.value }, option.label)
        )
      ),
      React.createElement('input', {
        'aria-label': `${inputId ?? 'creatable-select'} input`,
        value: inputValue,
        placeholder,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          setInputValue(event.currentTarget.value),
        onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter' && inputValue) {
            event.preventDefault()
            onChange([...value, { label: inputValue, value: inputValue }])
          }
        },
      }),
      React.createElement('span', null, createLabel)
    )
  }

  return {
    default: MockCreatableSelect,
  }
})

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
