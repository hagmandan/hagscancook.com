'use client'

import Select, {
  type ClassNamesConfig,
  type GroupBase,
  components,
  type MultiValueGenericProps,
} from 'react-select'
import CreatableSelect from 'react-select/creatable'
import styles from './MultiSelect.module.css'

type Option = { label: string; value: string }

function MultiValueLabel(props: MultiValueGenericProps<Option, true, GroupBase<Option>>) {
  return (
    <components.MultiValueLabel {...props}>
      <span title={props.data.label}>{props.children}</span>
    </components.MultiValueLabel>
  )
}

export interface MultiSelectProps {
  inputId?: string
  options: readonly { label: string; value: string }[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

function toSelected(values: string[], options: readonly Option[]): Option[] {
  return values.map((v) => options.find((o) => o.value === v) ?? { label: v, value: v })
}

const classNamesConfig: ClassNamesConfig<Option, true, GroupBase<Option>> = {
  control: ({ isFocused }) =>
    `${styles.control}${isFocused ? ` ${styles.controlFocused}` : ''}`,
  valueContainer: () => styles.valueContainer,
  multiValue: () => styles.multiValue,
  multiValueLabel: () => styles.multiValueLabel,
  multiValueRemove: () => styles.multiValueRemove,
  input: () => styles.input,
  placeholder: () => styles.placeholder,
  indicatorsContainer: () => styles.indicatorsContainer,
  dropdownIndicator: () => styles.dropdownIndicator,
  clearIndicator: () => styles.clearIndicator,
  indicatorSeparator: () => styles.indicatorSeparator,
  menu: () => styles.menu,
  menuList: () => styles.menuList,
  option: ({ isFocused, isSelected }) => {
    if (isSelected) return `${styles.option} ${styles.optionSelected}`
    if (isFocused) return `${styles.option} ${styles.optionFocused}`
    return styles.option
  },
  noOptionsMessage: () => styles.noOptionsMessage,
}

export function MultiSelect({ inputId, options, value, onChange, placeholder }: MultiSelectProps) {
  const selected = toSelected(value, options)

  return (
    <Select<Option, true>
      inputId={inputId}
      instanceId={inputId}
      isMulti
      unstyled
      options={[...options]}
      value={selected}
      onChange={(v) => onChange(v ? v.map((o) => o.value) : [])}
      placeholder={placeholder ?? 'Type to search…'}
      classNames={classNamesConfig}
      components={{ MultiValueLabel }}
    />
  )
}

export function CreatableMultiSelect({ inputId, options, value, onChange, placeholder }: MultiSelectProps) {
  const selected = toSelected(value, options)

  return (
    <CreatableSelect<Option, true>
      inputId={inputId}
      instanceId={inputId}
      isMulti
      unstyled
      options={[...options]}
      value={selected}
      onChange={(v) => onChange(v ? v.map((o) => o.value) : [])}
      placeholder={placeholder ?? 'Type to add…'}
      formatCreateLabel={(input) => `Add "${input}"`}
      classNames={classNamesConfig}
      components={{ MultiValueLabel }}
    />
  )
}
