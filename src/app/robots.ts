import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hagscancook.com'

// Known aggressive scrapers and AI training bots that ignore standard crawl
// etiquette or are used purely for data harvesting / security scanning.
// Blocking them here is advisory — real protection requires Cloud Armor rules
// on Firebase App Hosting (rate-limiting, bot-score-based blocking).
const BLOCKED_BOTS = [
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'PetalBot',
  'Bytespider',      // ByteDance / TikTok crawler
  'GPTBot',          // OpenAI training crawler
  'ChatGPT-User',
  'Google-Extended', // Gemini training crawler
  'CCBot',           // Common Crawl (feeds many AI datasets)
  'anthropic-ai',
  'ClaudeBot',
  'FacebookBot',
  'Applebot-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block known aggressive scrapers / AI training crawlers entirely
      {
        userAgent: BLOCKED_BOTS,
        disallow: '/',
      },
      // Allowlist approach: block everything, then carve out only public routes.
      // Any new public page must be explicitly added here.
      {
        userAgent: '*',
        allow: [
          '/$',             // home page only (not all of /)
          '/recipes/$',     // recipe index
          '/recipes/',      // individual recipe pages
          '/privacy',
          '/terms',
          '/dmca',
          '/sitemap.xml',
          '/_next/static/', // required so crawlers can render JS/CSS for indexing
          '/_next/image/',  // Next.js image optimizer
          '/favicon.ico',
          '/icon.png',
          '/apple-icon.png',
          '/images/',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
