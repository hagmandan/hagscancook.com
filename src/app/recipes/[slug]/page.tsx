/**
 * Recipe detail page — /recipes/[slug]
 *
 * Public Server Component. Fully SSR'd and crawlable.
 *
 * - Ingredients are always visible (guests and authenticated users)
 * - Instructions are gated: guests see a sign-up prompt rendered client-side
 *   by `<InstructionsGate>` after hydration
 *
 * The gate is client-side (not server-side) so the page HTML is identical for
 * all users — better for caching — and the gate UI appears after hydration
 * rather than causing a server redirect.
 */

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { InstructionsGate } from '@/components/recipe/InstructionsGate'
import { FavoriteButton } from '@/components/recipe/FavoriteButton'
import { toRecipeJsonLd } from '@/lib/utils/recipe-jsonld'
import styles from './recipe.module.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hagscancook.com'

interface RecipePageProps {
  params: Promise<{ slug: string }>
}

async function getRecipe(slug: string) {
  return db.recipe.findFirst({
    where: { slug, status: 'published', deletedAt: null },
    include: {
      author: { select: { displayName: true, avatarUrl: true } },
      steps: { orderBy: { order: 'asc' } },
      recipeIngredients: {
        orderBy: { order: 'asc' },
        include: { ingredient: { select: { name: true } } },
      },
      tags: { include: { tag: true } },
    },
  })
}

export async function generateMetadata({ params }: RecipePageProps) {
  const { slug } = await params
  const recipe = await getRecipe(slug)
  if (!recipe) return {}

  const canonicalUrl = `${SITE_URL}/recipes/${slug}`
  const images = recipe.coverImageUrl
    ? [{ url: recipe.coverImageUrl, alt: recipe.title }]
    : []

  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: recipe.title,
      description: recipe.description,
      url: canonicalUrl,
      type: 'article',
      images,
    },
    twitter: {
      card: recipe.coverImageUrl ? 'summary_large_image' : 'summary',
      title: recipe.title,
      description: recipe.description,
      images: recipe.coverImageUrl ? [recipe.coverImageUrl] : [],
    },
  }
}

async function getFavorited(userId: string, recipeId: string) {
  const fav = await db.favorite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
    select: { userId: true },
  })
  return !!fav
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params
  const [recipe, session] = await Promise.all([getRecipe(slug), getSession()])
  const isFavorited = session
    ? await getFavorited(session.userId, recipe?.id ?? '')
    : false

  if (!recipe) notFound()

  const totalMins =
    (recipe.prepTimeMins ?? 0) + (recipe.cookTimeMins ?? 0) || null

  const canonicalUrl = `${SITE_URL}/recipes/${slug}`
  const jsonLd = toRecipeJsonLd(recipe, canonicalUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <article className={styles.page}>
      {/* Cover image */}
      {recipe.coverImageUrl && (
        <div className={styles.cover}>
          <Image
            src={recipe.coverImageUrl}
            alt={recipe.title}
            fill
            priority
            sizes="100vw"
            className={styles.coverImage}
          />
        </div>
      )}

      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.meta}>
            {recipe.cuisine && (
              <span className={styles.cuisine}>{recipe.cuisine}</span>
            )}
            {recipe.difficulty && (
              <span className={styles.difficulty}>{recipe.difficulty}</span>
            )}
            {recipe.tags.map(({ tag }) => (
              <span key={tag.id} className={styles.tag}>
                {tag.name}
              </span>
            ))}
          </div>

          <h1 className={styles.title}>{recipe.title}</h1>
          <p className={styles.description}>{recipe.description}</p>

          <div className={styles.stats}>
            {recipe.prepTimeMins && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Prep</span>
                <span className={styles.statValue}>{recipe.prepTimeMins} min</span>
              </div>
            )}
            {recipe.cookTimeMins && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Cook</span>
                <span className={styles.statValue}>{recipe.cookTimeMins} min</span>
              </div>
            )}
            {totalMins && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Total</span>
                <span className={styles.statValue}>{totalMins} min</span>
              </div>
            )}
            {recipe.servings && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Serves</span>
                <span className={styles.statValue}>{recipe.servings}</span>
              </div>
            )}
          </div>

          <div className={styles.authorRow}>
            <div className={styles.author}>
              <span>Recipe by</span>
              <strong>{recipe.author.displayName}</strong>
            </div>
            {session && (
              <FavoriteButton
                recipeId={recipe.id}
                recipeSlug={recipe.slug}
                initialFavorited={isFavorited}
              />
            )}
          </div>
        </header>

        <div className={styles.body}>
          {/* Ingredients — always visible */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Ingredients</h2>
            {recipe.recipeIngredients.length === 0 ? (
              <p className={styles.empty}>No ingredients listed.</p>
            ) : (
              <ul className={styles.ingredientList}>
                {recipe.recipeIngredients.map((ri) => (
                  <li key={ri.id} className={styles.ingredientItem}>
                    <span className={styles.ingredientQty}>
                      {ri.quantity}
                      {ri.unit ? ` ${ri.unit}` : ''}
                    </span>
                    <span className={styles.ingredientName}>
                      {ri.ingredient.name}
                      {ri.preparation ? (
                        <span className={styles.prep}>, {ri.preparation}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Instructions — gated for guests */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Instructions</h2>
            <InstructionsGate
              isAuthenticated={!!session}
              steps={recipe.steps.map((s) => ({
                id: s.id,
                order: s.order,
                content: s.content,
              }))}
            />
          </section>
        </div>

        {/* Dietary restrictions */}
        {recipe.dietaryRestrictions.length > 0 && (
          <footer className={styles.dietary}>
            {recipe.dietaryRestrictions.map((d) => (
              <span key={d} className={styles.dietaryTag}>
                {d}
              </span>
            ))}
          </footer>
        )}
      </div>
    </article>
    </>
  )
}
