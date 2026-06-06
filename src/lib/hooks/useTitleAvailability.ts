'use client'

import { useEffect, useRef, useState } from 'react'

interface TitleAvailability {
  taken: boolean | null  // null = not yet checked / title too short
  checking: boolean
}

export function useTitleAvailability(
  title: string,
  excludeId?: string
): TitleAvailability {
  const [taken, setTaken] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (title.trim().length < 3) {
      setTaken(null)
      setChecking(false)
      return
    }

    setChecking(true)

    timerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ title })
        if (excludeId) params.set('excludeId', excludeId)
        const res = await fetch(`/api/recipes/check-title?${params}`)
        if (!res.ok) return
        const { taken } = (await res.json()) as { taken: boolean }
        setTaken(taken)
      } finally {
        setChecking(false)
      }
    }, 500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [title, excludeId])

  return { taken, checking }
}
