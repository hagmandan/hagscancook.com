// __mocks__/react-select.tsx
import React from 'react'
import type { ReactNode } from 'react'

type Option = { label: string; value: string }
type MultiValueLabelProps = { data: Option; children: ReactNode }
type SelectProps = {
  inputId?: string
  options: Option[]
  value: Option[]
  onChange: (value: Option[]) => void
  placeholder?: string
  components?: {
    MultiValueLabel?: (props: MultiValueLabelProps) => ReactNode
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

export default MockSelect
export const components = {
  MultiValueLabel: MockMultiValueLabel,
}
