import { useReducer, useCallback, useRef, useEffect } from 'react'
import { CharState } from '@/types'
import type { TypingChar, TypingStats } from '@/types'
import { compareChars } from '@/utils/charComparator'
import { calculateStats } from '@/utils/stats'
import type { SavedTypingSession } from '@/utils/typingSessionStorage'

export interface TypingEngineOptions {
  stopCursorAfterMistype?: boolean
  ignoreCapitalization?: boolean
  skipPunctuation?: boolean
  internationalMode?: boolean
}

export interface TypingEngineRestore {
  savedSession: SavedTypingSession | null
  bookSlug: string
  chapterIndex: number
  pageIndex: number
}

interface TypingState {
  chars: TypingChar[]
  cursorPosition: number
  startTime: number | null
  isComplete: boolean
}

type Action =
  | { type: 'KEY_PRESS'; key: string }
  | { type: 'RESET'; text: string }
  | { type: 'RESTORE'; text: string; session: SavedTypingSession }
const PUNCTUATION_CHARS = new Set([
  '.', ',', ';', ':', '!', '?', '"', "'",
  '(', ')', '[', ']', '{', '}', '-',
  '\u2014', '\u2013', '\u201C', '\u201D', '\u2018', '\u2019',
])

const IGNORED_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock',
  'Tab', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
  'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete',
])

function createInitialChars(text: string): TypingChar[] {
  return text.split('').map((char) => ({ char, state: CharState.UNTYPED }))
}

function createInitialState(text: string): TypingState {
  return {
    chars: createInitialChars(text),
    cursorPosition: 0,
    startTime: null,
    isComplete: text.length === 0,
  }
}

function createReducer(optionsRef: React.RefObject<TypingEngineOptions>) {
  return function reducer(state: TypingState, action: Action): TypingState {
    const options = optionsRef.current ?? {}

    switch (action.type) {
      case 'RESET':
        return createInitialState(action.text)

      case 'RESTORE': {
        const chars = action.text.split('').map((char, i) => ({
          char,
          state: action.session.charStates[i] ?? CharState.UNTYPED,
        }))
        return {
          chars,
          cursorPosition: action.session.cursorPosition,
          startTime: action.session.startTime,
          isComplete: action.session.cursorPosition >= chars.length,
        }
      }
      case 'KEY_PRESS': {
        const key = action.key

        if (IGNORED_KEYS.has(key)) return state

        // Handle backspace
        if (key === 'Backspace') {
          if (state.cursorPosition === 0) {
            // If cursor is at 0 but current char is INCORRECT (stopCursorAfterMistype),
            // clear it back to UNTYPED
            if (state.chars[0]?.state === CharState.INCORRECT) {
              const newChars = [...state.chars]
              newChars[0] = { ...newChars[0], state: CharState.UNTYPED }
              return { ...state, chars: newChars }
            }
            return state
          }
          const newChars = [...state.chars]
          const pos = state.cursorPosition - 1
          newChars[pos] = { ...newChars[pos], state: CharState.UNTYPED }
          return {
            ...state,
            chars: newChars,
            cursorPosition: pos,
          }
        }

        // Don't advance past end
        if (state.cursorPosition >= state.chars.length) return state

        const now = Date.now()
        const startTime = state.startTime ?? now

        // Map special keys to characters
        let typedChar = key
        if (key === 'Enter') typedChar = '\n'
        if (key === ' ') typedChar = ' '

        const cursor = state.cursorPosition
        const expectedChar = state.chars[cursor].char
        const newChars = [...state.chars]

        // International mode: single dash matches em-dash
        if (options.internationalMode && typedChar === '-' && expectedChar === '\u2014') {
          newChars[cursor] = { ...newChars[cursor], state: CharState.CORRECT }
          let newPos = cursor + 1

          // Skip punctuation if enabled
          if (options.skipPunctuation) {
            while (newPos < newChars.length && PUNCTUATION_CHARS.has(newChars[newPos].char)) {
              newChars[newPos] = { ...newChars[newPos], state: CharState.CORRECT }
              newPos++
            }
          }

          return {
            ...state,
            chars: newChars,
            cursorPosition: newPos,
            startTime,
            isComplete: newPos >= state.chars.length,
          }
        }

        const charResult = compareChars(typedChar, expectedChar, {
          ignoreCapitalization: options.ignoreCapitalization,
          internationalMode: options.internationalMode,
        })

        // Stop cursor after mistype: mark incorrect but don't advance
        if (charResult === CharState.INCORRECT && options.stopCursorAfterMistype) {
          newChars[cursor] = { ...newChars[cursor], state: CharState.INCORRECT, typedChar }
          return { ...state, chars: newChars, startTime }
        }

        // Normal: mark character and advance
        newChars[cursor] = {
          ...newChars[cursor],
          state: charResult,
          typedChar: charResult === CharState.INCORRECT ? typedChar : undefined,
        }
        let newPos = cursor + 1

        // Skip punctuation if enabled
        if (options.skipPunctuation) {
          while (newPos < newChars.length && PUNCTUATION_CHARS.has(newChars[newPos].char)) {
            newChars[newPos] = { ...newChars[newPos], state: CharState.CORRECT }
            newPos++
          }
        }

        return {
          ...state,
          chars: newChars,
          cursorPosition: newPos,
          startTime,
          isComplete: newPos >= state.chars.length,
        }
      }

      default:
        return state
    }
  }
}

export function useTypingEngine(
  text: string,
  options: TypingEngineOptions = {},
  restore?: TypingEngineRestore,
) {
  // Store options in a ref so the reducer always reads current values
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  const reducer = createReducer(optionsRef)
  const [state, dispatch] = useReducer(reducer, text, createInitialState)

  // Restore from saved session when restore context is provided
  useEffect(() => {
    if (restore?.savedSession) {
      dispatch({ type: 'RESTORE', text, session: restore.savedSession })
    }
  }, []) // Only on mount — eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyPress = useCallback(
    (key: string) => {
      dispatch({ type: 'KEY_PRESS', key })
    },
    [dispatch],
  )

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', text })
  }, [text, dispatch])

  const getStats = useCallback((): TypingStats => {
    let correct = 0
    let typed = 0
    const chars = state.chars
    for (let i = 0; i < chars.length; i++) {
      const s = chars[i].state
      if (s === CharState.CORRECT) { correct++; typed++ }
      else if (s === CharState.INCORRECT) { typed++ }
    }
    const elapsedMs = state.startTime ? Date.now() - state.startTime : 0
    return calculateStats({
      correctChars: correct,
      totalTypedChars: typed,
      elapsedMs,
    })
  }, [state.chars, state.startTime])

  return {
    chars: state.chars,
    cursorPosition: state.cursorPosition,
    isComplete: state.isComplete,
    startTime: state.startTime,
    handleKeyPress,
    reset,
    getStats,
  }
}
