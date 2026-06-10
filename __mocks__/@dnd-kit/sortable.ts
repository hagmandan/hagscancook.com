// __mocks__/@dnd-kit/sortable.ts
import { vi } from 'vitest'
import React from 'react'
import type { ReactNode } from 'react'

let _items: string[] = []

export function SortableContext({ children, items }: { children: ReactNode; items?: string[] }) {
  _items = items ?? []
  return React.createElement(React.Fragment, null, children)
}

/** Test helper — returns the items array passed to the last SortableContext render. */
export function getSortableItems(): string[] {
  return _items
}
export const sortableKeyboardCoordinates = vi.fn()
export const verticalListSortingStrategy = vi.fn()
export const useSortable = vi.fn(() => ({
  attributes: {},
  listeners: {},
  setNodeRef: vi.fn(),
  transform: null,
  transition: undefined,
  isDragging: false,
}))
