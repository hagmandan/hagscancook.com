'use server'

/**
 * Profile Server Actions.
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(80),
})

/**
 * Updates the current user's display name.
 *
 * @param formData - FormData from the profile form
 */
export async function updateProfile(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const session = await requireSession()

  const parsed = UpdateProfileSchema.safeParse({
    displayName: formData.get('displayName'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  await db.user.update({
    where: { id: session.userId },
    data: { displayName: parsed.data.displayName },
  })

  revalidatePath('/profile')
  return { ok: true }
}
