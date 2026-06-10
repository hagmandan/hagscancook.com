// __mocks__/@dnd-kit/core.ts
import { vi } from 'vitest'
import React from 'react'
import type { ReactNode } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'

type DndContextProps = { children: ReactNode; onDragEnd?: (event: DragEndEvent) => void }

let _onDragEnd: ((event: DragEndEvent) => void) | undefined

export function DndContext({ children, onDragEnd }: DndContextProps) {
  _onDragEnd = onDragEnd
  return React.createElement(React.Fragment, null, children)
}

/** Test helper — fires the onDragEnd callback captured from the last DndContext render. */
export function simulateDragEnd(event: DragEndEvent) {
  _onDragEnd?.(event)
}

export const closestCenter = vi.fn()
export const KeyboardSensor = vi.fn()
export const PointerSensor = vi.fn()
export const useSensor = vi.fn()
export const useSensors = vi.fn(() => [])
