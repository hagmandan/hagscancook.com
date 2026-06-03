'use client'

import { useTransition } from 'react'
import { setUserRole } from '@/lib/actions/admin'
import styles from '../admin.module.css'

interface AdminRoleSelectProps {
  userId: string
  currentRole: string
  disabled?: boolean
}

export function AdminRoleSelect({ userId, currentRole, disabled }: AdminRoleSelectProps) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value
    startTransition(async () => { await setUserRole(userId, newRole) })
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={disabled || isPending}
      className={styles.addSelect}
      style={{ minWidth: '7rem' }}
      aria-label="User role"
    >
      <option value="user">user</option>
      <option value="chef">chef</option>
      <option value="admin">admin</option>
    </select>
  )
}
