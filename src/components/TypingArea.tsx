import { useRef, useEffect, useCallback, useState } from 'react'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import type { TypingEngineOptions, TypingEngineRestore } from '@/hooks/useTypingEngine'
import { CharState } from '@/types'
import type { TypingStats, CursorStyle, StatsUpdateFrequency } from '@/types'
import {
  saveTypingSession,
  clearTypingSession,
} from '@/utils/typingSessionStorage'
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
}: TypingAreaProps) {
  const {
    chars,
    cursorPosition,
    isComplete,
    startTime,
    handleKeyPress,
    getStats,
  } = useTypingEngine(text, options, sessionRestore)
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const prevCompleteRef = useRef(false)
  const [isFocused, setIsFocused] = useState(false)

  const lastStatsPosRef = useRef(-1)

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
  // Auto-scroll: only when cursor leaves the viewport. Uses instant scroll to
  // avoid animation pileup during rapid typing (e.g. holding Backspace).
  useEffect(() => {
    if (!autoScroll || !cursorRef.current) return
    const rect = cursorRef.current.getBoundingClientRect()
    const inView = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (!inView) {
      cursorRef.current.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }
  }, [cursorPosition, autoScroll])

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
  }, [cursorPosition, chars, isFocused, text])

  // Stats reporting controlled by statsUpdateFrequency
  const shouldReportStats = useCallback(
    (pos: number): boolean => {
      if (startTime === null) return false

      switch (statsUpdateFrequency) {
        case 'page':
          return isComplete
        case 'line': {
          // Report when cursor crosses a newline or on completion
          if (isComplete) return true
          if (chars[pos]?.char === '\n') return true
          if (pos > 0) return chars[pos - 1]?.char === '\n'
          return false
        }
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

  // --- Session persistence ---
  // Debounced save (500ms) + visibilitychange/beforeunload for immediate save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestStateRef = useRef({ cursorPosition, chars, startTime })
  latestStateRef.current = { cursorPosition, chars, startTime }

  const hasSession = sessionRestore?.bookSlug != null

  // Clear saved session on complete
  useEffect(() => {
    if (isComplete && hasSession) {
      clearTypingSession(
        sessionRestore!.bookSlug,
        sessionRestore!.chapterIndex,
        sessionRestore!.pageIndex,
      )
    }
  }, [isComplete, hasSession]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save on every cursor position change
  useEffect(() => {
    if (!hasSession || isComplete) return
    if (cursorPosition === 0 && startTime === null) return // nothing typed yet

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const { cursorPosition: cp, chars: ch, startTime: st } = latestStateRef.current
      saveTypingSession(
        sessionRestore!.bookSlug,
        sessionRestore!.chapterIndex,
        sessionRestore!.pageIndex,
        cp,
        ch.map((c) => c.state),
        st,
        text,
      )
    }, 2000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [cursorPosition, hasSession, isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  // Immediate save on visibility change (tab hidden) and beforeunload
  useEffect(() => {
    if (!hasSession) return

    function flush() {
      const { cursorPosition: cp, chars: ch, startTime: st } = latestStateRef.current
      if (cp === 0 && st === null) return
      saveTypingSession(
        sessionRestore!.bookSlug,
        sessionRestore!.chapterIndex,
        sessionRestore!.pageIndex,
        cp,
        ch.map((c) => c.state),
        st,
        text,
      )
    }

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
  }, [hasSession]) // eslint-disable-line react-hooks/exhaustive-deps

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
      onBlur={() => setIsFocused(false)}
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
