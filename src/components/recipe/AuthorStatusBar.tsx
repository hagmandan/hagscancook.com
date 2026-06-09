import { StatusToggle } from './StatusToggle'
import styles from './AuthorStatusBar.module.css'

interface AuthorStatusBarProps {
  recipeId: string
  currentStatus: 'draft' | 'published'
}

export function AuthorStatusBar({ recipeId, currentStatus }: AuthorStatusBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.barInner}>
      <span className={styles.label}>
        {currentStatus === 'published' ? 'Published' : 'Draft — only you can see this'}
      </span>
      <StatusToggle recipeId={recipeId} currentStatus={currentStatus} />
    </div>
    </div>
  )
}
