/**
 * Profile page — /profile
 *
 * Authenticated Server Component. Renders a client-side profile form for
 * updating display name. Email and avatar (from Google SSO) are shown
 * read-only.
 */

import { requireSession } from '@/lib/auth'
import { ProfileForm } from './ProfileForm'
import styles from './profile.module.css'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await requireSession()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <div className={styles.card}>
        {/* Avatar */}
        <div className={styles.avatarSection}>
          {session.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.avatarUrl}
              alt={session.displayName}
              className={styles.avatar}
              width={72}
              height={72}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {session.displayName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className={styles.avatarName}>{session.displayName}</p>
            <p className={styles.avatarEmail}>{session.email}</p>
          </div>
        </div>

        <hr className={styles.divider} />

        <ProfileForm initialDisplayName={session.displayName} />
      </div>
    </div>
  )
}
