import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(80),
})
