import { useRef, useEffect, useCallback } from 'react'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import type { TypingStats } from '@/types'
import CharSpan from './CharSpan'
import styles from './TypingArea.module.css'

interface TypingAreaProps {
  text: string
  onComplete?: () => void
  onStatsUpdate?: (stats: TypingStats) => void
}

export default function TypingArea({ text, onComplete, onStatsUpdate }: TypingAreaProps) {
  const {
    chars,
    cursorPosition,
    isComplete,
    startTime,
    handleKeyPress,
    getStats,
  } = useTypingEngine(text)

  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const prevCompleteRef = useRef(false)

  // Capture keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Prevent default for keys that would interfere (scroll, tab navigation)
      if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Enter') {
        e.preventDefault()
      }
      handleKeyPress(e.key)
    },
    [handleKeyPress],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [cursorPosition])

  // Report stats on meaningful changes
  useEffect(() => {
    if (onStatsUpdate && startTime !== null) {
      onStatsUpdate(getStats())
    }
  }, [cursorPosition, isComplete, startTime, getStats, onStatsUpdate])

  // Fire onComplete once when page finishes
  useEffect(() => {
    if (isComplete && !prevCompleteRef.current) {
      prevCompleteRef.current = true
      onComplete?.()
    }
    if (!isComplete) {
      prevCompleteRef.current = false
    }
  }, [isComplete, onComplete])

  // Reset the completion flag when reset is needed externally
  // (reset is from useTypingEngine; page re-mounts on text change)

  // Build paragraph groups from chars, splitting on double newlines
  const paragraphs = buildParagraphs(chars, cursorPosition)

  return (
    <div
      ref={containerRef}
      className={styles.area}
      tabIndex={0}
      data-testid="typing-area"
      role="textbox"
      aria-label="Typing area"
    >
      {text.length === 0 ? (
        <p className={styles.empty}>No text to type.</p>
      ) : (
        paragraphs.map((para, pIdx) => (
          <p key={pIdx} className={styles.paragraph}>
            {para.map((item) =>
              item.isCursor ? (
                <CharSpan
                  key={item.idx}
                  ref={cursorRef}
                  char={item.char}
                  state={item.state}
                  isCursor={true}
                />
              ) : (
                <CharSpan
                  key={item.idx}
                  char={item.char}
                  state={item.state}
                  isCursor={false}
                />
              ),
            )}
          </p>
        ))
      )}
    </div>
  )
}

interface CharItem {
  idx: number
  char: string
  state: import('@/types').CharState
  isCursor: boolean
}

function buildParagraphs(
  chars: import('@/types').TypingChar[],
  cursorPosition: number,
): CharItem[][] {
  const paragraphs: CharItem[][] = []
  let current: CharItem[] = []

  for (let i = 0; i < chars.length; i++) {
    const { char, state } = chars[i]

    // Detect paragraph break: \n followed by \n
    if (char === '\n' && i + 1 < chars.length && chars[i + 1].char === '\n') {
      // Push the newline char as a visual element in current paragraph
      current.push({ idx: i, char, state, isCursor: i === cursorPosition })
      if (current.length > 0) {
        paragraphs.push(current)
        current = []
      }
      // Skip the second newline
      i++
      // Also push the second newline if it's the cursor position
      if (i === cursorPosition) {
        current.push({ idx: i, char: chars[i].char, state: chars[i].state, isCursor: true })
      }
      continue
    }

    current.push({ idx: i, char, state, isCursor: i === cursorPosition })

    // Single newline at end of text or not followed by another newline
    if (char === '\n' && (i + 1 >= chars.length || chars[i + 1].char !== '\n')) {
      paragraphs.push(current)
      current = []
    }
  }

  if (current.length > 0) {
    paragraphs.push(current)
  }

  return paragraphs.length > 0 ? paragraphs : [[]]
}
