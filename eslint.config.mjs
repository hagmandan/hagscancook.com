import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Next.js recommended rules (includes React, React Hooks, accessibility)
  ...compat.extends('next/core-web-vitals'),

  // TypeScript rules — applied to all .ts/.tsx files
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Disallow `any` — use Prisma-generated types, Zod inferred types, or `unknown`
      '@typescript-eslint/no-explicit-any': 'error',
      // Catch unused variables at lint time rather than runtime
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Ignore generated and build artifacts
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'prisma/generated/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
]

export default config
