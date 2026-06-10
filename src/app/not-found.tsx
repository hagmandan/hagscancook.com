import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <section className={styles.shell} aria-labelledby="not-found-title">
        <div className={styles.card}>
          <div className={styles.eyebrow} aria-hidden="true">
            404
          </div>
          <h1 id="not-found-title" className={styles.title}>
            That page was 86&rsquo;d.
          </h1>
          <p className={styles.subtitle}>
            The recipe, route, or secret pantry shelf you were looking for is
            off the menu.
          </p>
          <div className={styles.actions}>
            <Link href="/" className={styles.primary}>
              Back to recipes
            </Link>
            <Link href="/login" className={styles.secondary}>
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
