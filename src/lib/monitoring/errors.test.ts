import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/nextjs'
import { captureException } from './errors'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

describe('captureException', () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockReset()
  })

  it('passes safe tags and context to Sentry', () => {
    const error = new Error('boom')

    captureException(error, {
      feature: 'recipe-form',
      operation: 'create',
      recipeId: 'recipe-123',
      ingredientCount: 4,
      stepCount: 3,
      runtime: 'client',
    })

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: {
        feature: 'recipe-form',
        operation: 'create',
        runtime: 'client',
      },
      contexts: {
        app: {
          recipeId: 'recipe-123',
          ingredientCount: 4,
          stepCount: 3,
        },
      },
    })
  })

  it('omits optional tags when no context is provided', () => {
    const error = 'string error'

    captureException(error)

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: {},
      contexts: {
        app: {
          recipeId: undefined,
          ingredientCount: undefined,
          stepCount: undefined,
        },
      },
    })
  })
})
