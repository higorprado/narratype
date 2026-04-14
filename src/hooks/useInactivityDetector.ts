import { useRef, useEffect, useCallback } from 'react'

interface UseInactivityDetectorOptions {
  enabled: boolean
  triggerPosition: number
  inactivityTimeoutSeconds: number
  onInactive: (lastKeystrokeTime: number) => void
  onResume: () => void
  /** If true, the timer won't start (e.g. session not started or complete). */
  paused: boolean
}

export function useInactivityDetector({
  enabled,
  triggerPosition,
  inactivityTimeoutSeconds,
  onInactive,
  onResume,
  paused,
}: UseInactivityDetectorOptions) {
  const lastKeystrokeTimeRef = useRef<number | null>(null)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isIdleRef = useRef(false)

  // Restart inactivity timer on every keystroke (cursor position change)
  useEffect(() => {
    if (!enabled || paused) return
    lastKeystrokeTimeRef.current = Date.now()

    // If resuming from idle, notify parent
    if (isIdleRef.current) {
      isIdleRef.current = false
      onResume()
    }

    // Restart timer
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    inactivityTimerRef.current = setTimeout(() => {
      isIdleRef.current = true
      onInactive(lastKeystrokeTimeRef.current!)
    }, inactivityTimeoutSeconds * 1000)

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
    }
  }, [triggerPosition]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pause: clear the timer and mark idle (call on blur)
  const handlePause = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
    isIdleRef.current = true
  }, [])

  return {
    isIdleRef,
    lastKeystrokeTimeRef,
    handlePause,
  }
}
