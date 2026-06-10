'use server'

/**
 * Profile Server Actions.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { parseOrError } from '@/lib/schemas/validation'
import { UpdateProfileSchema } from '@/lib/schemas/profile'

/**
 * Updates the current user's display name.
 *
 * @param formData - FormData from the profile form
 */
export async function updateProfile(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const session = await requireSession()

  const result = parseOrError(UpdateProfileSchema, {
    displayName: formData.get('displayName'),
  })
  if ('error' in result) return result

  await db.user.update({
    where: { id: session.userId },
    data: { displayName: result.data.displayName },
  })

  revalidatePath('/profile')
  return { ok: true }
}
