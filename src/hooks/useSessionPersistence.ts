import { useRef, useEffect, useCallback } from 'react'
import type { TypingChar } from '@/types'
import {
  saveTypingSession,
  clearTypingSession,
} from '@/utils/typingSessionStorage'

interface UseSessionPersistenceOptions {
  enabled: boolean
  cursorPosition: number
  chars: TypingChar[]
  startTime: number | null
  isComplete: boolean
  bookSlug: string
  chapterIndex: number
  pageIndex: number
  text: string
}

export function useSessionPersistence({
  enabled,
  cursorPosition,
  chars,
  startTime,
  isComplete,
  bookSlug,
  chapterIndex,
  pageIndex,
  text,
}: UseSessionPersistenceOptions) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestStateRef = useRef({ cursorPosition, chars, startTime })
  latestStateRef.current = { cursorPosition, chars, startTime }

  const flush = useCallback(() => {
    const { cursorPosition: cp, chars: ch, startTime: st } = latestStateRef.current
    if (cp === 0 && st === null) return
    saveTypingSession(bookSlug, chapterIndex, pageIndex, cp, ch.map((c) => c.state), st, text)
  }, [bookSlug, chapterIndex, pageIndex, text])

  // Clear saved session on complete
  useEffect(() => {
    if (isComplete && enabled) {
      clearTypingSession(bookSlug, chapterIndex, pageIndex)
    }
  }, [isComplete, enabled, bookSlug, chapterIndex, pageIndex])

  // Debounced save on every cursor position change
  useEffect(() => {
    if (!enabled || isComplete) return
    if (cursorPosition === 0 && startTime === null) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      flush()
    }, 2000)
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        flush()
      }
    }
  }, [cursorPosition, enabled, isComplete, flush])

  // Immediate save on visibility change (tab hidden) and beforeunload
  useEffect(() => {
    if (!enabled) return

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    const onBeforeUnload = () => flush()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [enabled, flush])

  return { flush }
}
