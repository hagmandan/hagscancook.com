import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  org: 'dan-hagman',
  project: 'hagscancook-com',

  // Auth token for source map uploads — set SENTRY_AUTH_TOKEN as an
  // App Hosting secret so production stack traces are readable.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print upload logs in CI
  silent: !process.env.CI,

  // Upload a wider set of source maps for better stack traces
  widenClientFileUpload: true,

  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
