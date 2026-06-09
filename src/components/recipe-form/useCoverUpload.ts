'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth } from '@/lib/firebase-client'
import { captureException } from '@/lib/monitoring/errors'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_COVER_IMAGE_MB = 5

/** Manages cover photo upload state using the Firebase Storage client SDK. */
export function useCoverUpload(setValue: UseFormReturn<RecipeFormValues>['setValue']) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError('Please choose a JPEG, PNG, WebP, or GIF image.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_COVER_IMAGE_BYTES) {
      setUploadError(`Cover image must be ${MAX_COVER_IMAGE_MB}MB or smaller.`)
      e.target.value = ''
      return
    }
    setIsUploading(true)
    setUploadError(null)
    try {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')
      const storage = getStorage(auth.app)
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const storagePath = `covers/${uid}/${Date.now()}.${ext}`
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, file, { contentType: file.type })
      const publicUrl = await getDownloadURL(storageRef)
      setValue('coverImageUrl', publicUrl, { shouldDirty: true })
    } catch (err) {
      captureException(err, { feature: 'image-upload', operation: 'upload', runtime: 'client' })
      setUploadError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return { isUploading, uploadError, fileInputRef, handleCoverUpload }
}
