/**
 * Site footer.
 */

import Link from 'next/link'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copy}>
          &copy;{new Date().getFullYear()} HagsCanCook
        </p>
        <nav className={styles.links}>
          <Link href="/terms" className={styles.link}>
            Terms
          </Link>
          <Link href="/privacy" className={styles.link}>
            Privacy
          </Link>
          <Link href="/dmca" className={styles.link}>
            DMCA
          </Link>
        </nav>
      </div>
    </footer>
  )
}
