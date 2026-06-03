'use client'

/**
 * PillSelect — typeahead multi-select with pill chips.
 *
 * Displays selected values as dismissible pills. An inline input filters
 * the suggestions dropdown. When `allowCustom` is true, pressing Enter or
 * comma commits any typed text as a new custom pill.
 *
 * @param options      - Predefined suggestion list
 * @param value        - Currently selected values (controlled)
 * @param onChange     - Called with the new values array on every change
 * @param placeholder  - Input placeholder shown when nothing is selected
 * @param allowCustom  - When true, arbitrary text can be added as a pill
 * @param id           - Optional id for the underlying input (for <label htmlFor>)
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import styles from './PillSelect.module.css'

interface PillSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  allowCustom?: boolean
  id?: string
}

export function PillSelect({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  allowCustom = false,
  id,
}: PillSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options
    .filter((o) => !value.includes(o))
    .filter((o) => o.toLowerCase().includes(query.toLowerCase()))

  const customCandidate =
    allowCustom &&
    query.trim().length > 0 &&
    !value.includes(query.trim()) &&
    !options.some((o) => o.toLowerCase() === query.trim().toLowerCase())

  function add(option: string) {
    const trimmed = option.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  function remove(option: string) {
    onChange(value.filter((v) => v !== option))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && query.trim()) {
      e.preventDefault()
      if (filtered.length > 0) {
        add(filtered[0])
      } else if (allowCustom) {
        add(query.trim())
      }
    }
    if (e.key === 'Backspace' && !query && value.length > 0) {
      remove(value[value.length - 1])
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const showDropdown = open && (filtered.length > 0 || customCandidate)

  return (
    <div className={styles.root} ref={containerRef}>
      <div
        className={styles.field}
        onClick={() => inputRef.current?.focus()}
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
      >
        {value.map((v) => (
          <span key={v} className={styles.pill}>
            {v}
            <button
              type="button"
              className={styles.pillRemove}
              onClick={(e) => {
                e.stopPropagation()
                remove(v)
              }}
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className={styles.input}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="pill-select-dropdown"
        />
      </div>

      {showDropdown && (
        <ul
          className={styles.dropdown}
          id="pill-select-dropdown"
          role="listbox"
        >
          {filtered.map((o) => (
            <li
              key={o}
              className={styles.option}
              role="option"
              aria-selected={false}
              // mousedown fires before blur so we can prevent the input losing focus
              onMouseDown={(e) => {
                e.preventDefault()
                add(o)
              }}
            >
              {highlightMatch(o, query)}
            </li>
          ))}
          {customCandidate && (
            <li
              className={`${styles.option} ${styles.optionCustom}`}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault()
                add(query.trim())
              }}
            >
              Add &ldquo;<strong>{query.trim()}</strong>&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps the matching substring in a <mark> for visual highlight. */
function highlightMatch(text: string, query: string) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}
