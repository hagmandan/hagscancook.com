import Link from 'next/link'
import styles from './PaginationBar.module.css'

interface PaginationBarProps {
  currentPage: number
  totalPages: number
  basePath: string
  extraParams?: Record<string, string>
}

export function PaginationBar({
  currentPage,
  totalPages,
  basePath,
  extraParams = {},
}: PaginationBarProps) {
  if (totalPages <= 1) return null

  function buildHref(page: number) {
    const params = new URLSearchParams({ ...extraParams, page: String(page) })
    return `${basePath}?${params}`
  }

  return (
    <nav className={styles.bar} aria-label="Pagination">
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className={styles.link}>
          ← Previous
        </Link>
      ) : (
        <span className={styles.disabled}>← Previous</span>
      )}
      <span className={styles.label}>
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className={styles.link}>
          Next →
        </Link>
      ) : (
        <span className={styles.disabled}>Next →</span>
      )}
    </nav>
  )
}
