// __mocks__/@dnd-kit/core.ts
import { vi } from 'vitest'
import React from 'react'
import type { ReactNode } from 'react'

export function DndContext({ children }: { children: ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}
export const closestCenter = vi.fn()
export const KeyboardSensor = vi.fn()
export const PointerSensor = vi.fn()
export const useSensor = vi.fn()
export const useSensors = vi.fn(() => [])
