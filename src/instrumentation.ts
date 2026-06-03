/**
 * Next.js instrumentation entry point.
 *
 * Called once when a new server instance starts. Registers the Sentry SDK for
 * the appropriate runtime (nodejs vs edge) so server errors, Server Action
 * failures, and middleware errors are captured automatically.
 *
 * `onRequestError` captures errors thrown by Server Components, middleware,
 * and proxies — errors that would otherwise be silently swallowed.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
