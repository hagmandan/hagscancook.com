import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment:
    process.env.NEXT_PUBLIC_APP_ENV ??
    (process.env.NODE_ENV === 'production' ? 'production' : 'local'),

  // Disabled in local dev to avoid noise — set NEXT_PUBLIC_APP_ENV in
  // apphosting.yaml to enable for preview/production deployments.
  enabled: process.env.NODE_ENV !== 'development',

  // Phase 2: enable performance tracing once baselines exist.
  tracesSampleRate: 0,

  // Never send PII — no emails, names, or raw recipe content.
  sendDefaultPii: false,

  // Ignore common browser extension and environment noise.
  ignoreErrors: [
    /extensions\//i,
    /^chrome:\/\//i,
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
})
