/**
 * Prisma CLI configuration (Prisma 7+).
 *
 * Provides the database connection URL for Prisma CLI commands:
 *   prisma migrate dev / deploy / reset
 *   prisma db seed / pull / push
 *   prisma studio
 *
 * Uses DIRECT_URL (not the pooled connection) because Neon's connection
 * pooler (PgBouncer) does not support the DDL statements that migrations
 * and introspection require.
 *
 * At runtime, PrismaClient uses DATABASE_URL (pooled) via @prisma/adapter-neon
 * — see src/lib/db.ts.
 *
 * Environment variables:
 *   DIRECT_URL  — Neon direct (non-pooled) connection string
 *                 e.g. postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
 *
 * Note: `dotenv/config` loads .env — Prisma CLI does not auto-read .env.local.
 * Add DIRECT_URL to .env (local dev) and store it as a Cloud Secret Manager
 * secret for production (referenced in apphosting.yaml).
 */

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
})
