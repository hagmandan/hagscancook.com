import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hagscancook.com'

/**
 * Dynamic sitemap — served at /sitemap.xml
 *
 * Includes all static public routes plus every published recipe.
 * Auth-only and admin routes are intentionally excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recipes = await db.recipe.findMany({
    where: { status: 'published', deletedAt: null },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const recipeEntries: MetadataRoute.Sitemap = recipes.map((r) => ({
    url: `${SITE_URL}/recipes/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/recipes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/dmca`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...recipeEntries,
  ]
}
