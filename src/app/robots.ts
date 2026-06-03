import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hagscancook.com'

/**
 * Robots rules — served at /robots.txt
 *
 * Public recipe content is fully crawlable. Auth-only pages and the admin
 * section are disallowed to avoid indexing private or restricted content.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/my-recipes',
          '/favorites',
          '/profile',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
