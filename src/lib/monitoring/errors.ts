/**
 * Privacy-safe error capture wrapper around Sentry.
 *
 * All call sites use `captureException` from here rather than importing Sentry
 * directly. This enforces a consistent privacy posture: only pre-approved
 * non-PII fields can be attached to errors.
 *
 * NEVER pass to ErrorContext:
 *   - recipe title, description, or content
 *   - ingredient names or step text
 *   - user email or display name
 *   - raw search queries
 *   - uploaded file names or content
 *
 * Safe to pass:
 *   - UUIDs (opaque, non-reversible without DB access)
 *   - counts (ingredientCount, stepCount)
 *   - feature/operation labels
 *   - runtime context
 */

import * as Sentry from '@sentry/nextjs'

/** Non-PII context fields safe to attach to Sentry events. */
export interface ErrorContext {
  /** e.g. 'recipe-form', 'recipe-detail', 'admin', 'import' */
  feature?: string
  /** e.g. 'create', 'update', 'delete', 'publish', 'upload' */
  operation?: string
  /** Opaque recipe UUID — not a human-readable identifier */
  recipeId?: string
  ingredientCount?: number
  stepCount?: number
  runtime?: 'server' | 'client' | 'edge'
}

/**
 * Captures an exception in Sentry with sanitized, non-PII context.
 *
 * @param error   - The caught error (any type)
 * @param context - Optional safe context fields (see ErrorContext)
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  Sentry.captureException(error, {
    tags: {
      ...(context?.feature != null && { feature: context.feature }),
      ...(context?.operation != null && { operation: context.operation }),
      ...(context?.runtime != null && { runtime: context.runtime }),
    },
    contexts: {
      app: {
        recipeId: context?.recipeId,
        ingredientCount: context?.ingredientCount,
        stepCount: context?.stepCount,
      },
    },
  })
}
