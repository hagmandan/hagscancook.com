/**
 * Shared layout for all legal pages (/terms, /privacy, /dmca).
 * Route group (legal) keeps these pages organized without affecting URLs.
 */

import Link from 'next/link'
import styles from './legal.module.css'

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/dmca', label: 'DMCA & Copyright' },
]

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarHeading}>Legal</p>
        <nav className={styles.sidebarNav}>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={styles.sidebarLink}>
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
