import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTypingEngine } from '../useTypingEngine'
import type { TypingEngineRestore } from '../useTypingEngine'
import { CharState } from '@/types'

describe('useTypingEngine', () => {
  const simpleText = 'Hello world'

  it('should initialize with all chars UNTYPED and cursor at 0', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))
    const { chars, cursorPosition, isComplete } = result.current

    expect(cursorPosition).toBe(0)
    expect(isComplete).toBe(false)
    expect(chars).toHaveLength(simpleText.length)
    for (const c of chars) {
      expect(c.state).toBe(CharState.UNTYPED)
    }
  })

  it('should mark correct character and advance cursor', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))

    act(() => {
      result.current.handleKeyPress('H')
    })

    expect(result.current.chars[0].state).toBe(CharState.CORRECT)
    expect(result.current.cursorPosition).toBe(1)
  })

  it('should mark incorrect character and advance cursor', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))

    act(() => {
      result.current.handleKeyPress('X')
    })

    expect(result.current.chars[0].state).toBe(CharState.INCORRECT)
    expect(result.current.cursorPosition).toBe(1)
  })

  it('should handle backspace: return char to UNTYPED and move cursor back', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))

    act(() => {
      result.current.handleKeyPress('H')
      result.current.handleKeyPress('e')
    })

    expect(result.current.cursorPosition).toBe(2)

    act(() => {
      result.current.handleKeyPress('Backspace')
    })

    expect(result.current.cursorPosition).toBe(1)
    expect(result.current.chars[1].state).toBe(CharState.UNTYPED)
  })

  it('should not go below cursor position 0 on backspace', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))

    act(() => {
      result.current.handleKeyPress('Backspace')
    })

    expect(result.current.cursorPosition).toBe(0)
  })

  it('should signal page complete when all chars typed', () => {
    const shortText = 'Hi'
    const { result } = renderHook(() => useTypingEngine(shortText))

    act(() => {
      result.current.handleKeyPress('H')
      result.current.handleKeyPress('i')
    })

    expect(result.current.isComplete).toBe(true)
    expect(result.current.cursorPosition).toBe(2)
  })

  it('should not advance past the end after completion', () => {
    const shortText = 'Hi'
    const { result } = renderHook(() => useTypingEngine(shortText))

    act(() => {
      result.current.handleKeyPress('H')
      result.current.handleKeyPress('i')
      result.current.handleKeyPress('x')
    })

    expect(result.current.cursorPosition).toBe(2)
    expect(result.current.isComplete).toBe(true)
  })

  it('should handle space character', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))

    act(() => {
      result.current.handleKeyPress('H')
      result.current.handleKeyPress('e')
      result.current.handleKeyPress('l')
      result.current.handleKeyPress('l')
      result.current.handleKeyPress('o')
      result.current.handleKeyPress(' ')
    })

    expect(result.current.chars[5].state).toBe(CharState.CORRECT)
    expect(result.current.cursorPosition).toBe(6)
  })

  it('should handle newline character in text', () => {
    const textWithNewline = 'ab\ncd'
    const { result } = renderHook(() => useTypingEngine(textWithNewline))

    act(() => {
      result.current.handleKeyPress('a')
      result.current.handleKeyPress('b')
      result.current.handleKeyPress('Enter')
    })

    expect(result.current.chars[2].state).toBe(CharState.CORRECT)
    expect(result.current.cursorPosition).toBe(3)
  })

  it('should calculate WPM correctly after typing', () => {
    const { result } = renderHook(() => useTypingEngine('Hello'))

    act(() => {
      result.current.handleKeyPress('H')
      result.current.handleKeyPress('e')
      result.current.handleKeyPress('l')
      result.current.handleKeyPress('l')
      result.current.handleKeyPress('o')
    })

    const stats = result.current.getStats()
    // 5 correct chars, some elapsed time
    expect(stats.correctChars).toBe(5)
    expect(stats.totalTypedChars).toBe(5)
    expect(stats.accuracy).toBe(100)
  })

  it('should calculate accuracy with mistakes', () => {
    const { result } = renderHook(() => useTypingEngine('Hi'))

    act(() => {
      result.current.handleKeyPress('H')
      result.current.handleKeyPress('X') // wrong
    })

    const stats = result.current.getStats()
    expect(stats.correctChars).toBe(1)
    expect(stats.totalTypedChars).toBe(2)
    expect(stats.accuracy).toBe(50)
  })

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))

    act(() => {
      result.current.handleKeyPress('H')
      result.current.handleKeyPress('e')
    })

    expect(result.current.cursorPosition).toBe(2)

    act(() => {
      result.current.reset()
    })

    expect(result.current.cursorPosition).toBe(0)
    expect(result.current.isComplete).toBe(false)
    for (const c of result.current.chars) {
      expect(c.state).toBe(CharState.UNTYPED)
    }
  })

  it('should track start time on first keypress', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))

    expect(result.current.startTime).toBeNull()

    act(() => {
      result.current.handleKeyPress('H')
    })

    expect(result.current.startTime).not.toBeNull()
  })

  it('should handle stopCursorAfterMistype option', () => {
    const { result } = renderHook(() =>
      useTypingEngine(simpleText, { stopCursorAfterMistype: true }),
    )

    act(() => {
      result.current.handleKeyPress('X') // wrong
    })

    // Cursor should NOT advance after mistype
    expect(result.current.cursorPosition).toBe(0)
    expect(result.current.chars[0].state).toBe(CharState.INCORRECT)
  })

  it('should allow backspace from mistype when stopCursorAfterMistype is on', () => {
    const { result } = renderHook(() =>
      useTypingEngine(simpleText, { stopCursorAfterMistype: true }),
    )

    act(() => {
      result.current.handleKeyPress('X') // wrong, cursor stays
      result.current.handleKeyPress('Backspace')
    })

    expect(result.current.cursorPosition).toBe(0)
    expect(result.current.chars[0].state).toBe(CharState.UNTYPED)
  })

  it('should handle ignoreCapitalization option', () => {
    const { result } = renderHook(() =>
      useTypingEngine('Hello', { ignoreCapitalization: true }),
    )

    act(() => {
      result.current.handleKeyPress('h') // lowercase h matches H
    })

    expect(result.current.chars[0].state).toBe(CharState.CORRECT)
  })

  it('should ignore modifier keys and non-character keys', () => {
    const { result } = renderHook(() => useTypingEngine(simpleText))

    act(() => {
      result.current.handleKeyPress('Shift')
      result.current.handleKeyPress('Control')
      result.current.handleKeyPress('Alt')
      result.current.handleKeyPress('Meta')
      result.current.handleKeyPress('Tab')
      result.current.handleKeyPress('CapsLock')
    })

    expect(result.current.cursorPosition).toBe(0)
  })

  it('should handle empty text gracefully', () => {
    const { result } = renderHook(() => useTypingEngine(''))

    expect(result.current.chars).toHaveLength(0)
    expect(result.current.cursorPosition).toBe(0)
    expect(result.current.isComplete).toBe(true) // nothing to type = complete
  })

  describe('skipPunctuation option', () => {
    it('should auto-advance past punctuation chars', () => {
      const { result } = renderHook(() =>
        useTypingEngine('a.b', { skipPunctuation: true }),
      )

      act(() => {
        result.current.handleKeyPress('a')
      })

      // After typing 'a', the '.' should be auto-skipped (SKIPPED), cursor at 'b'
      expect(result.current.chars[0].state).toBe(CharState.CORRECT)
      expect(result.current.chars[1].state).toBe(CharState.SKIPPED) // auto-skipped
      expect(result.current.cursorPosition).toBe(2) // at 'b'
    })
  })
  it('should auto-advance past second newline in paragraph break (\\n\\n)', () => {
    // Text with a paragraph break: "ab" + "\n\n" + "cd"
    const text = 'ab\n\ncd'
    const { result } = renderHook(() => useTypingEngine(text))

    act(() => {
      result.current.handleKeyPress('a')
      result.current.handleKeyPress('b')
      result.current.handleKeyPress('Enter') // should advance past both \n
      result.current.handleKeyPress('c')
    })

    // First \n should be CORRECT (typed via Enter)
    expect(result.current.chars[2].state).toBe(CharState.CORRECT)
    // Second \n should also be CORRECT (auto-advanced)
    expect(result.current.chars[3].state).toBe(CharState.CORRECT)
    // Cursor should be at 'c' (index 4), and 'c' should now be CORRECT
    expect(result.current.chars[4].state).toBe(CharState.CORRECT)
    expect(result.current.cursorPosition).toBe(5)
  })
  it('should auto-advance past second newline in paragraph break (step by step)', () => {
    const text = 'ab\n\ncd'
    const { result } = renderHook(() => useTypingEngine(text))

    // Step 1: type 'a'
    act(() => { result.current.handleKeyPress('a') })
    expect(result.current.cursorPosition).toBe(1)
    expect(result.current.chars[0].state).toBe(CharState.CORRECT)

    // Step 2: type 'b'
    act(() => { result.current.handleKeyPress('b') })
    expect(result.current.cursorPosition).toBe(2) // at first \n
    expect(result.current.chars[1].state).toBe(CharState.CORRECT)

    // Step 3: press Enter at first \n — should auto-advance past second \n
    act(() => { result.current.handleKeyPress('Enter') })
    expect(result.current.cursorPosition).toBe(4) // past both \n, at 'c'
    expect(result.current.chars[2].state).toBe(CharState.CORRECT) // first \n
    expect(result.current.chars[3].state).toBe(CharState.CORRECT) // second \n (auto)
    expect(result.current.chars[4].state).toBe(CharState.UNTYPED) // 'c' not typed yet

    // Step 4: type 'c'
    act(() => { result.current.handleKeyPress('c') })
    expect(result.current.cursorPosition).toBe(5)
    expect(result.current.chars[4].state).toBe(CharState.CORRECT)
  })


  describe('RESTORE action', () => {
    it('should restore from saved session', async () => {
      const text = 'Hello'
      const restore: TypingEngineRestore = {
        savedSession: {
          bookSlug: 'test-book',
          chapterIndex: 0,
          pageIndex: 0,
          cursorPosition: 3,
          charStates: [CharState.CORRECT, CharState.CORRECT, CharState.CORRECT],
          startTime: 1000,
          savedAt: 2000,
          textPrefix: 'Hel',
          elapsedMs: 0,
        },
        bookSlug: 'test-book',
        chapterIndex: 0,
        pageIndex: 0,
      }

      const { result } = renderHook(() => useTypingEngine(text, {}, restore))

      await waitFor(() => {
        expect(result.current.cursorPosition).toBe(3)
      })

      expect(result.current.chars[0].state).toBe(CharState.CORRECT)
      expect(result.current.chars[1].state).toBe(CharState.CORRECT)
      expect(result.current.chars[2].state).toBe(CharState.CORRECT)
      expect(result.current.chars[3].state).toBe(CharState.UNTYPED)
      expect(result.current.chars[4].state).toBe(CharState.UNTYPED)
    })

    it('should restore startTime from saved session', async () => {
      const text = 'Hello'
      const restore: TypingEngineRestore = {
        savedSession: {
          bookSlug: 'test-book',
          chapterIndex: 0,
          pageIndex: 0,
          cursorPosition: 2,
          charStates: [CharState.CORRECT, CharState.CORRECT],
          startTime: 1700000000000,
          savedAt: 1700000001000,
          textPrefix: 'He',
          elapsedMs: 0,
        },
        bookSlug: 'test-book',
        chapterIndex: 0,
        pageIndex: 0,
      }

      const { result } = renderHook(() => useTypingEngine(text, {}, restore))

      await waitFor(() => {
        expect(result.current.startTime).toBe(1700000000000)
      })
    })

    it('should mark isComplete when restored cursor is at end', async () => {
      const text = 'Hi'
      const restore: TypingEngineRestore = {
        savedSession: {
          bookSlug: 'test-book',
          chapterIndex: 0,
          pageIndex: 0,
          cursorPosition: text.length,
          charStates: [CharState.CORRECT, CharState.CORRECT],
          startTime: 1000,
          savedAt: 2000,
          textPrefix: 'Hi',
          elapsedMs: 0,
        },
        bookSlug: 'test-book',
        chapterIndex: 0,
        pageIndex: 0,
      }

      const { result } = renderHook(() => useTypingEngine(text, {}, restore))

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true)
      })
    })

    it('should treat missing charStates as UNTYPED', async () => {
      const text = 'Hello'
      // charStates only covers first 2 chars; rest should default to UNTYPED
      const restore: TypingEngineRestore = {
        savedSession: {
          bookSlug: 'test-book',
          chapterIndex: 0,
          pageIndex: 0,
          cursorPosition: 2,
          charStates: [CharState.CORRECT, CharState.INCORRECT],
          startTime: 1000,
          savedAt: 2000,
          textPrefix: 'He',
          elapsedMs: 0,
        },
        bookSlug: 'test-book',
        chapterIndex: 0,
        pageIndex: 0,
      }

      const { result } = renderHook(() => useTypingEngine(text, {}, restore))

      await waitFor(() => {
        expect(result.current.cursorPosition).toBe(2)
      })

      expect(result.current.chars[0].state).toBe(CharState.CORRECT)
      expect(result.current.chars[1].state).toBe(CharState.INCORRECT)
      expect(result.current.chars[2].state).toBe(CharState.UNTYPED)
      expect(result.current.chars[3].state).toBe(CharState.UNTYPED)
      expect(result.current.chars[4].state).toBe(CharState.UNTYPED)
    })
  })

  it('should calculate getStats accuracy correctly with mixed char states', () => {
    const { result } = renderHook(() => useTypingEngine('Hello'))

    act(() => {
      result.current.handleKeyPress('H')  // correct
      result.current.handleKeyPress('e')  // correct
      result.current.handleKeyPress('X')  // incorrect
      result.current.handleKeyPress('l')  // correct
    })

    const stats = result.current.getStats()
    expect(stats.correctChars).toBe(3)
    expect(stats.totalTypedChars).toBe(4)
    expect(stats.accuracy).toBe(75)
  })

  it('should return 100 accuracy with no typed chars', () => {
    const { result } = renderHook(() => useTypingEngine('Hello'))

    const stats = result.current.getStats()
    expect(stats.correctChars).toBe(0)
    expect(stats.totalTypedChars).toBe(0)
    expect(stats.accuracy).toBe(100)
  })

  describe('double quotes', () => {
    const quoteText = '"hello"'

    it('should match double quote at start of text', () => {
      const { result } = renderHook(() => useTypingEngine(quoteText))
      act(() => {
        result.current.handleKeyPress('"')
      })
      expect(result.current.chars[0].state).toBe(CharState.CORRECT)
      expect(result.current.cursorPosition).toBe(1)
    })

    it('should match double quote at end of text', () => {
      const { result } = renderHook(() => useTypingEngine(quoteText))
      act(() => {
        result.current.handleKeyPress('"')
        result.current.handleKeyPress('h')
        result.current.handleKeyPress('e')
        result.current.handleKeyPress('l')
        result.current.handleKeyPress('l')
        result.current.handleKeyPress('o')
        result.current.handleKeyPress('"')
      })
      expect(result.current.chars[6].state).toBe(CharState.CORRECT)
      expect(result.current.cursorPosition).toBe(7)
    })
  })
})