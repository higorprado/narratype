import { useRef, useEffect } from 'react'
import type { TypingChar } from '@/types'

interface UseCursorOverlayOptions {
  cursorRef: React.RefObject<HTMLElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  cursorPosition: number
  chars: TypingChar[]
  isFocused: boolean
  text: string
}

export function useCursorOverlay({
  cursorRef,
  containerRef,
  cursorPosition,
  chars,
  isFocused,
  text,
}: UseCursorOverlayOptions) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Position the cursor overlay to match the active character's bounding rect
  useEffect(() => {
    const charEl = cursorRef.current
    const container = containerRef.current
    const overlay = overlayRef.current
    if (!charEl || !container || !overlay) return

    const charRect = charEl.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    overlay.style.left = `${charRect.left - containerRect.left}px`
    overlay.style.top = `${charRect.top - containerRect.top}px`
    overlay.style.width = `${charRect.width}px`
    overlay.style.height = `${charRect.height}px`
  }, [cursorPosition, chars, isFocused, text, cursorRef, containerRef])

  return { overlayRef }
}
