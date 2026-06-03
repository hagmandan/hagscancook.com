import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment:
    process.env.NEXT_PUBLIC_APP_ENV ??
    (process.env.NODE_ENV === 'production' ? 'production' : 'local'),

  // Phase 3: enable with OpenTelemetry instrumentation.
  tracesSampleRate: 0,

  // Never send PII — no emails, names, or raw recipe content.
  sendDefaultPii: false,
})
