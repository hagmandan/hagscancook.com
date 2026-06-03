/**
 * Recipe card — used in grid views (homepage, full feed, my-recipes, favorites).
 *
 * Accepts a partial recipe object so the parent can select only the fields it
 * needs from the DB query. Rendered as a Server Component — no interactivity.
 */

import Link from 'next/link'
import Image from 'next/image'
import styles from './RecipeCard.module.css'

/** Subset of Recipe fields required to render the card. */
export interface RecipeCardData {
  id: string
  slug: string
  title: string
  description: string
  coverImageUrl: string | null
  prepTimeMins: number | null
  cookTimeMins: number | null
  servings: number | null
  cuisine: string | null
  author: { displayName: string }
}

interface RecipeCardProps {
  recipe: RecipeCardData
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalMins =
    (recipe.prepTimeMins ?? 0) + (recipe.cookTimeMins ?? 0) || null

  return (
    <Link href={`/recipes/${recipe.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {recipe.coverImageUrl ? (
          <Image
            src={recipe.coverImageUrl}
            alt={recipe.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden />
        )}
      </div>

      <div className={styles.body}>
        {recipe.cuisine && (
          <span className={styles.cuisine}>{recipe.cuisine}</span>
        )}
        <h3 className={styles.title}>{recipe.title}</h3>
        <p className={styles.description}>{recipe.description}</p>

        <div className={styles.meta}>
          {totalMins && (
            <span className={styles.metaItem}>{totalMins} min</span>
          )}
          {recipe.servings && (
            <span className={styles.metaItem}>Serves {recipe.servings}</span>
          )}
          <span className={styles.author}>by {recipe.author.displayName}</span>
        </div>
      </div>
    </Link>
  )
}
