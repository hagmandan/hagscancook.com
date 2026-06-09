// __mocks__/react-select/creatable.tsx
import React from 'react'

type Option = { label: string; value: string }
type CreatableProps = {
  inputId?: string
  options: Option[]
  value: Option[]
  onChange: (value: Option[]) => void
  placeholder?: string
  formatCreateLabel?: (input: string) => string
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
  const createLabel = inputValue
    ? (formatCreateLabel ?? ((v: string) => `Create "${v}"`))(inputValue)
    : placeholder

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

export default MockCreatableSelect
