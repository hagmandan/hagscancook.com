/**
 * POST /api/upload
 *
 * Returns a Firebase Storage signed URL for direct client-side cover photo upload.
 *
 * Flow:
 * 1. Client POSTs `{ filename, contentType }` here
 * 2. This handler verifies the session, generates a signed write URL + a
 *    public read URL, and returns both
 * 3. Client PUTs the file directly to Firebase Storage using the signed URL
 * 4. Client stores the public URL in the `coverImageUrl` form field
 *
 * Accepted content types: image/jpeg, image/png, image/webp, image/gif
 * Max file size is enforced client-side; the signed URL itself has no size limit.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { getSession } from '@/lib/auth'
import { captureException } from '@/lib/monitoring/errors'

function initAdmin() {
  if (getApps().length > 0) return
  const encodedKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!encodedKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set')
  const serviceAccount = JSON.parse(
    Buffer.from(encodedKey, 'base64').toString('utf-8')
  )
  initializeApp({ credential: cert(serviceAccount) })
}

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = (await request.json()) as {
      filename?: unknown
      contentType?: unknown
    }

    if (
      typeof body.filename !== 'string' ||
      typeof body.contentType !== 'string'
    ) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      )
    }

    if (!ALLOWED_CONTENT_TYPES.has(body.contentType)) {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      )
    }

    initAdmin()

    // Sanitise the filename and scope it to the user's UID
    const ext = body.filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const storagePath = `covers/${session.firebaseUid}/${Date.now()}.${ext}`

    const bucket = getStorage().bucket(
      process.env.FIREBASE_STORAGE_BUCKET ??
        `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
    )
    const file = bucket.file(storagePath)

    const [signedUrl] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      contentType: body.contentType,
    })

    // Public read URL (requires the bucket to have public-read ACL or Firebase
    // Storage rules allowing reads without auth — suitable for cover photos)
    const encodedPath = encodeURIComponent(storagePath)
    const bucketName = bucket.name
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`

    return NextResponse.json({ uploadUrl: signedUrl, publicUrl })
  } catch (err) {
    console.error('[/api/upload]', err)
    captureException(err, { feature: 'image-upload', operation: 'upload', runtime: 'server' })
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
