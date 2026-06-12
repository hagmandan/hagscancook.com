import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { toSlug } from '@/lib/utils/slugify'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? ''
  const excludeId = searchParams.get('excludeId') ?? undefined

  const slug = toSlug(title)
  if (!slug) return NextResponse.json({ error: 'Title too short' }, { status: 400 })

  const existing = await db.recipe.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true },
  })

  const taken = !!existing && existing.id !== excludeId

  return NextResponse.json(
    { taken, slug },
    {
      headers: { 'Cache-Control': 'private, max-age=60' },
    }
  )
}
