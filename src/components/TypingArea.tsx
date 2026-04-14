import { useRef, useEffect, useCallback, useState } from 'react'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import type { TypingEngineOptions, TypingEngineRestore } from '@/hooks/useTypingEngine'
import { useStatsAccumulator } from '@/hooks/useStatsAccumulator'
import { CharState } from '@/types'
import type { TypingStats, CursorStyle, StatsUpdateFrequency } from '@/types'
import { calculateWPM } from '@/utils/stats'
import { useCursorOverlay } from '@/hooks/useCursorOverlay'
import { useInactivityDetector } from '@/hooks/useInactivityDetector'
import { useSessionPersistence } from '@/hooks/useSessionPersistence'
import CharSpan from './CharSpan'
import styles from './TypingArea.module.css'

/** Maps CursorStyle to the overlay CSS module class. */
const overlayStyleMap: Record<CursorStyle, string> = {
  BOX: styles.cursorBox,
  LINE: styles.cursorLine,
  UNDER: styles.cursorUnder,
  DOT: styles.cursorDot,
  HIGH: styles.cursorHigh,
  'E-BOX': styles.cursorEBox,
  'H-UNDER': styles.cursorHUnder,
  'H-DOT': styles.cursorHDot,
  NONE: styles.cursorNone,
}

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
  sessionRestore?: TypingEngineRestore
  inactivityTimeout?: number
  onInactivity?: () => void
  onActivity?: () => void
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
  sessionRestore,
  inactivityTimeout = 5,
  onInactivity,
  onActivity,
}: TypingAreaProps) {
  const {
    chars,
    cursorPosition,
    isComplete,
    startTime,
    handleKeyPress,
    getStats,
  } = useTypingEngine(text, options, sessionRestore)
  const statsAcc = useStatsAccumulator()
  const hasSession = sessionRestore?.bookSlug != null
  const { flush: sessionFlush } = useSessionPersistence({
    enabled: hasSession,
    cursorPosition,
    chars,
    startTime,
    isComplete,
    bookSlug: sessionRestore?.bookSlug ?? '',
    chapterIndex: sessionRestore?.chapterIndex ?? 0,
    pageIndex: sessionRestore?.pageIndex ?? 0,
    text,
    getElapsedMs: statsAcc.getElapsedMs,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const { overlayRef } = useCursorOverlay({ cursorRef, containerRef, cursorPosition, chars, isFocused, text })
  const prevCompleteRef = useRef(false)

  const lastStatsPosRef = useRef(-1)
  const prevCursorPosRef = useRef(0)

  // Restore accumulator state from a saved session. The stats accumulator starts
  // at zero on every mount, so we must pre-populate it with historical data.
  // We use a ref to track whether we've handled the restore. The actual population
  // and cursor sync happens when the engine finishes restoring (cursorPosition matches).
  const restoredRef = useRef(false)
  const session = sessionRestore?.savedSession
  if (session && !restoredRef.current && cursorPosition === session.cursorPosition) {
    restoredRef.current = true
    const correctChars = session.charStates.filter((s) => s === 'CORRECT').length
    statsAcc.restore(correctChars, session.elapsedMs)
    prevCursorPosRef.current = cursorPosition
  }
  // Inactivity timeout tracking
  const { isIdleRef, lastKeystrokeTimeRef, handlePause: handleInactivityPause } = useInactivityDetector({
    enabled: onInactivity != null,
    triggerPosition: cursorPosition,
    inactivityTimeoutSeconds: inactivityTimeout,
    paused: startTime === null || isComplete,
    onInactive: (lastKeystrokeTime) => {
      statsAcc.onPause(lastKeystrokeTime)
      const frozenStats = buildFullStatsAtTime(lastKeystrokeTime)
      onStatsUpdate?.(frozenStats)
      onInactivity?.()
      if (sessionRestore?.bookSlug != null) sessionFlush()
    },
    onResume: () => onActivity?.(),
  })

  // Dead key tracking: on international keyboards (ABNT2, US-Intl, etc.), pressing
  // ' sends key='Dead'. We store the physical key code, then when the user
  // presses space (to produce standalone ') we process it.
  const deadKeyRef = useRef<string | null>(null)

  // Map physical key codes to their dead-key base character
  const DEAD_KEY_MAP: Record<string, string> = {
    Quote: "'",
    Backquote: '`',
  }

  // Capture keyboard input (disabled in reading mode)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (readingMode) return
      if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
      }

      // Handle dead key: store the base char and wait for next key
      if (e.key === 'Dead') {
        const base = DEAD_KEY_MAP[e.code]
        if (base) deadKeyRef.current = base
        return
      }

      // If a dead key was pending, check if this completes it
      if (deadKeyRef.current !== null) {
        const base = deadKeyRef.current
        deadKeyRef.current = null
        // Space after dead key → produce the standalone dead character
        if (e.key === ' ') {
          handleKeyPress(base)
          return
        }
        // Any other key: the OS composes them, but keydown still fires with the
        // raw key. Let it fall through to normal processing.
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
  // Auto-scroll: scrolls before cursor reaches the bottom edge (2-line lookahead).
  // Skipped when cursorPosition === 0 to avoid interfering with the parent's
  // useLayoutEffect scroll reset on page transitions.
  useEffect(() => {
    if (!autoScroll || !cursorRef.current || cursorPosition === 0) return
    const rect = cursorRef.current.getBoundingClientRect()
    const lineHeight = rect.height || 24
    const threshold = lineHeight * 2
    const bottomBound = window.innerHeight - threshold
    if (rect.top < 0 || rect.bottom > bottomBound + lineHeight) {
      cursorRef.current.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [cursorPosition, autoScroll])

  // Build complete stats: char counts from engine, time from accumulator
  const buildFullStats = useCallback((): TypingStats => {
    const charStats = getStats()
    const elapsedMs = statsAcc.getElapsedMs()
    return {
      ...charStats,
      elapsedMs,
      wpm: calculateWPM(charStats.correctChars, elapsedMs),
    }
  }, [getStats, statsAcc])

  const buildFullStatsAtTime = useCallback((timestamp: number): TypingStats => {
    const charStats = getStats()
    const elapsedMs = statsAcc.getElapsedMsAtTime(timestamp)
    return {
      ...charStats,
      elapsedMs,
      wpm: calculateWPM(charStats.correctChars, elapsedMs),
    }
  }, [getStats, statsAcc])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (startTime === null || isComplete || isIdleRef.current) return

    const pauseTime = lastKeystrokeTimeRef.current ?? Date.now()
    statsAcc.onPause(pauseTime)

    handleInactivityPause()
    const frozenStats = buildFullStatsAtTime(pauseTime)
    onStatsUpdate?.(frozenStats)
    onInactivity?.()
  }, [startTime, isComplete, statsAcc, buildFullStatsAtTime, onStatsUpdate, onInactivity, isIdleRef, lastKeystrokeTimeRef, handleInactivityPause])

  // Stats reporting controlled by statsUpdateFrequency
  const shouldReportStats = useCallback(
    (pos: number): boolean => {
      if (startTime === null) return false

      switch (statsUpdateFrequency) {
        case 'page':
          return isComplete
        case 'word':
        default:
          // Report at word boundaries (after spaces) or on completion
          if (isComplete) return true
          if (pos > 0) return chars[pos - 1]?.char === ' '
          return true // first keystroke
      }
    },
    [startTime, statsUpdateFrequency, isComplete, chars],
  )

  useEffect(() => {
    if (!onStatsUpdate) return
    if (cursorPosition === lastStatsPosRef.current) return
    lastStatsPosRef.current = cursorPosition

    if (shouldReportStats(cursorPosition)) {
      onStatsUpdate(buildFullStats())
    }
  }, [cursorPosition, isComplete, startTime, buildFullStats, onStatsUpdate, shouldReportStats, chars])

  // Track cursor changes in stats accumulator
  useEffect(() => {
    if (cursorPosition === prevCursorPosRef.current) return
    const delta = cursorPosition - prevCursorPosRef.current
    prevCursorPosRef.current = cursorPosition

    if (delta > 0) {
      // Forward movement: could be multiple chars (skip punctuation, paragraph break)
      for (let i = 0; i < delta; i++) statsAcc.onCharTyped()
    } else if (delta < 0) {
      statsAcc.onCharDeleted()
    }
  }, [cursorPosition, statsAcc])

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

  // Determine active char style (BOX inverts text, HIGH highlights text)
  const effectiveCursorStyle = cursorStyle ?? 'BOX'
  const activeCharStyle: React.CSSProperties =
    effectiveCursor === -1 ? {}
    : effectiveCursorStyle === 'BOX' ? { color: 'var(--color-surface)' }
    : effectiveCursorStyle === 'HIGH' ? { color: 'var(--color-cursor)' }
    : {}

  const showOverlay = effectiveCursor !== -1

  return (
    <div
      ref={containerRef}
      className={styles.area}
      tabIndex={readingMode ? undefined : 0}
      data-testid="typing-area"
      role={readingMode ? undefined : 'textbox'}
      aria-label="Typing area"
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
    >
      {showOverlay && (
        <div
          ref={overlayRef}
          className={[
            styles.cursorOverlay,
            smoothCursor ? styles.cursorOverlaySmooth : '',
            overlayStyleMap[effectiveCursorStyle],
          ].filter(Boolean).join(' ')}
        />
      )}
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
                  showLiteralMistypes={showLiteralMistypes}
                  typedChar={item.typedChar}
                  style={activeCharStyle}
                />
              ) : (
                <CharSpan
                  key={item.idx}
                  char={item.char}
                  state={item.state}
                  isCursor={false}
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
