import { useRef, useEffect, useCallback, useState } from 'react'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import type { TypingEngineOptions } from '@/hooks/useTypingEngine'
import { CharState } from '@/types'
import type { TypingStats, CursorStyle, StatsUpdateFrequency } from '@/types'
import CharSpan from './CharSpan'
import styles from './TypingArea.module.css'

interface TypingAreaProps {
  text: string
  onComplete?: () => void
  onStatsUpdate?: (stats: TypingStats) => void
  options?: TypingEngineOptions
  cursorStyle?: CursorStyle
  autoScroll?: boolean
  smoothCursor?: boolean
  readingMode?: boolean
  showLiteralMistypes?: boolean
  statsUpdateFrequency?: StatsUpdateFrequency
}

export default function TypingArea({
  text,
  onComplete,
  onStatsUpdate,
  options,
  cursorStyle,
  autoScroll = true,
  smoothCursor = false,
  readingMode = false,
  showLiteralMistypes = false,
  statsUpdateFrequency = 'word',
}: TypingAreaProps) {
  const {
    chars,
    cursorPosition,
    isComplete,
    startTime,
    handleKeyPress,
    getStats,
  } = useTypingEngine(text, options)

  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const prevCompleteRef = useRef(false)
  const [isFocused, setIsFocused] = useState(false)

  const lastStatsPosRef = useRef(-1)

  // Capture keyboard input (disabled in reading mode)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (readingMode) return
      if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
      }
      handleKeyPress(e.key)
    },
    [handleKeyPress, readingMode],
  )

  // Auto-focus the typing area on mount
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (autoScroll && cursorRef.current) {
      cursorRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [cursorPosition, autoScroll])

  // Stats reporting controlled by statsUpdateFrequency
  const shouldReportStats = useCallback(
    (pos: number): boolean => {
      if (startTime === null) return false

      switch (statsUpdateFrequency) {
        case 'page':
          return isComplete
        case 'line': {
          // Report on newlines and on completion
          if (isComplete) return true
          const char = chars[pos]
          return char?.char === '\n'
        }
        case 'word':
        default:
          // Report on every position change (every keystroke effectively)
          return true
      }
    },
    [startTime, statsUpdateFrequency, isComplete, chars],
  )

  useEffect(() => {
    if (!onStatsUpdate) return
    if (cursorPosition === lastStatsPosRef.current) return
    lastStatsPosRef.current = cursorPosition

    if (shouldReportStats(cursorPosition)) {
      onStatsUpdate(getStats())
    }
  }, [cursorPosition, isComplete, startTime, getStats, onStatsUpdate, shouldReportStats, chars])

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

  // Build paragraph groups from chars, splitting on double newlines
  // In reading mode, render all chars as CORRECT
  const effectiveChars = readingMode
    ? chars.map((c) => ({ ...c, state: CharState.CORRECT }))
    : chars
  const effectiveCursor = readingMode ? -1 : (isFocused ? cursorPosition : -1)

  const paragraphs = buildParagraphs(effectiveChars, effectiveCursor)

  return (
    <div
      ref={containerRef}
      className={styles.area}
      tabIndex={readingMode ? undefined : 0}
      data-testid="typing-area"
      role={readingMode ? undefined : 'textbox'}
      aria-label="Typing area"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
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
                  cursorStyle={cursorStyle}
                  smoothCursor={smoothCursor}
                  showLiteralMistypes={showLiteralMistypes}
                  typedChar={item.typedChar}
                />
              ) : (
                <CharSpan
                  key={item.idx}
                  char={item.char}
                  state={item.state}
                  isCursor={false}
                  smoothCursor={smoothCursor}
                  showLiteralMistypes={showLiteralMistypes}
                  typedChar={item.typedChar}
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
  typedChar?: string
}

function buildParagraphs(
  chars: import('@/types').TypingChar[],
  cursorPosition: number,
): CharItem[][] {
  const paragraphs: CharItem[][] = []
  let current: CharItem[] = []

  for (let i = 0; i < chars.length; i++) {
    const { char, state, typedChar } = chars[i]

    // Detect paragraph break: \n followed by \n
    if (char === '\n' && i + 1 < chars.length && chars[i + 1].char === '\n') {
      current.push({ idx: i, char, state, isCursor: i === cursorPosition, typedChar })
      if (current.length > 0) {
        paragraphs.push(current)
        current = []
      }
      // Skip the second newline
      i++
      // Also push the second newline if it's the cursor position
      if (i === cursorPosition) {
        current.push({ idx: i, char: chars[i].char, state: chars[i].state, isCursor: true, typedChar: chars[i].typedChar })
      }
      continue
    }

    current.push({ idx: i, char, state, isCursor: i === cursorPosition, typedChar })

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
