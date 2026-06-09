// __mocks__/@dnd-kit/sortable.ts
import { vi } from 'vitest'
import React from 'react'
import type { ReactNode } from 'react'

export function SortableContext({ children }: { children: ReactNode }) {
  return React.createElement(React.Fragment, null, children)
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
