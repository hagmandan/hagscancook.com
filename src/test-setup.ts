import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { vi } from 'vitest'

// Polyfill crypto.randomUUID in jsdom (not available by default)
if (!globalThis.crypto?.randomUUID) {
  let counter = 0
  globalThis.crypto = {
    ...globalThis.crypto,
    randomUUID: () => `test-id-${++counter}`,
  } as Crypto
}

// Configure @testing-library/react to advance Vitest fake timers inside waitFor,
// mirroring the Jest integration that the library ships with out of the box.
configure({
  asyncWrapper: async (cb) => {
    const result = await cb()
    // Drain microtask queue when fake timers are active, the same way
    // the built-in Jest shim does with jest.advanceTimersByTime(0).
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
      // If Vitest fake timers are active, tick them forward so the
      // setTimeout above resolves without hanging.
      try {
        vi.advanceTimersByTime(0)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        // real timers — ignore
      }
    })
    return result
  },
})
