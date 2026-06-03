/**
 * Prisma client singleton (Prisma 7 + Neon serverless adapter).
 *
 * Prisma 7 requires a driver adapter to be passed to PrismaClient instead of
 * reading the URL from schema.prisma. We use @prisma/adapter-neon, which
 * wraps @neondatabase/serverless for efficient HTTP-based queries from
 * serverless and edge runtimes.
 *
 * Uses DATABASE_URL (the pooled connection string from Neon) at runtime.
 * Migrations use DIRECT_URL instead — see prisma.config.ts.
 *
 * The `globalThis` guard prevents new PrismaClient instances from being
 * created on every Next.js hot-reload in development, which would exhaust
 * Neon's connection pool.
 *
 * Usage:
 *   import { db } from '@/lib/db'
 *   const recipes = await db.recipe.findMany()
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Extend globalThis to hold the cached Prisma instance in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. ' +
        'Add it to .env (local dev) or as a Cloud Secret Manager secret ' +
        'referenced in apphosting.yaml for production.'
    )
  }
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
