import type { ZodType } from 'zod'

/**
 * Runs safeParse and returns { data } on success or { error } on failure.
 * Extracts the first issue message, falling back to the provided default.
 */
export function parseOrError<T>(
  schema: ZodType<T>,
  input: unknown,
  fallbackMessage = 'Invalid input'
): { data: T } | { error: string } {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? fallbackMessage }
  }
  return { data: parsed.data }
}
