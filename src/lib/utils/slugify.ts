/**
 * URL-safe slug generation with collision handling.
 *
 * Converts a recipe title to a lowercase hyphen-separated slug, then checks
 * the database for conflicts. If a conflict exists, appends an incrementing
 * numeric suffix (e.g. "pasta-bake-2", "pasta-bake-3").
 *
 * Must be called server-side (accesses the DB via Prisma).
 *
 * @param title - The recipe title to slugify
 * @param excludeId - Recipe ID to exclude from collision checks (for updates)
 * @returns A unique slug string
 */

import { db } from '@/lib/db'

export function toSlug(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // strip non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-')   // collapse whitespace/underscores/hyphens to single hyphen
    .replace(/^-+|-+$/g, '')    // trim leading/trailing hyphens
    .slice(0, 100)              // cap length
}

export async function generateUniqueSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const base = toSlug(title) || 'recipe'

  // Fetch all existing slugs with this prefix in one query.
  // May include false positives (e.g. "pasta-bake" when base is "pasta"),
  // but those just sit in the Set unused — only exact candidates are checked.
  const rows = await db.recipe.findMany({
    where: { slug: { startsWith: base }, deletedAt: null },
    select: { id: true, slug: true },
  })

  const taken = new Set(
    rows
      .filter((r) => !excludeId || r.id !== excludeId)
      .map((r) => r.slug)
  )

  if (!taken.has(base)) return base

  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) return candidate
  }

  return `${base}-${Date.now()}`
}
