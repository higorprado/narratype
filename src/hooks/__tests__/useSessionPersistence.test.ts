import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionPersistence } from '@/hooks/useSessionPersistence'
import { saveTypingSession, clearTypingSession } from '@/utils/typingSessionStorage'
import { CharState } from '@/types'

vi.mock('@/utils/typingSessionStorage', () => ({
  saveTypingSession: vi.fn(),
  clearTypingSession: vi.fn(),
}))

const mockSave = vi.mocked(saveTypingSession)
const mockClear = vi.mocked(clearTypingSession)

function defaultChars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    char: String.fromCharCode(97 + i),
    state: i === 0 ? CharState.UNTYPED : CharState.UNTYPED,
  }))
}

const baseOpts = {
  enabled: true,
  cursorPosition: 0,
  chars: defaultChars(3),
  startTime: null as number | null,
  isComplete: false,
  bookSlug: 'test-book',
  chapterIndex: 0,
  pageIndex: 0,
  text: 'abc',
  getElapsedMs: () => 0,
}

describe('useSessionPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSave.mockReset()
    mockClear.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not save when disabled', () => {
    const { } = renderHook(
      (opts) => useSessionPersistence(opts),
      { initialProps: { ...baseOpts, enabled: false, cursorPosition: 1, startTime: 1000 } },
    )
    vi.advanceTimersByTime(3000)
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('does not save when nothing has been typed', () => {
    renderHook(() => useSessionPersistence(baseOpts))
    vi.advanceTimersByTime(3000)
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('debounces save and calls saveTypingSession after timeout', () => {
    renderHook(() =>
      useSessionPersistence({ ...baseOpts, cursorPosition: 1, startTime: 1000 }),
    )
    expect(mockSave).not.toHaveBeenCalled()

    vi.advanceTimersByTime(2000)
    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(mockSave).toHaveBeenCalledWith(
      'test-book', 0, 0, 1,
      [CharState.UNTYPED, CharState.UNTYPED, CharState.UNTYPED],
      1000, 0, 'abc',
    )
  })

  it('flushes immediately on cleanup (unmount/re-render)', () => {
    const { unmount } = renderHook(() =>
      useSessionPersistence({ ...baseOpts, cursorPosition: 2, startTime: 1000 }),
    )
    // Timer is pending; unmount should flush immediately
    unmount()
    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it('clears session when page is completed', () => {
    const { rerender } = renderHook(
      (opts) => useSessionPersistence(opts),
      { initialProps: baseOpts },
    )
    rerender({ ...baseOpts, isComplete: true })
    expect(mockClear).toHaveBeenCalledWith('test-book', 0, 0)
  })

  it('does not clear session when disabled', () => {
    const { rerender } = renderHook(
      (opts) => useSessionPersistence(opts),
      { initialProps: { ...baseOpts, enabled: false } },
    )
    rerender({ ...baseOpts, enabled: false, isComplete: true })
    expect(mockClear).not.toHaveBeenCalled()
  })

  it('saves on visibilitychange when tab is hidden', () => {
    renderHook(() =>
      useSessionPersistence({ ...baseOpts, cursorPosition: 1, startTime: 1000 }),
    )

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it('saves on beforeunload', () => {
    renderHook(() =>
      useSessionPersistence({ ...baseOpts, cursorPosition: 1, startTime: 1000 }),
    )

    act(() => {
      window.dispatchEvent(new Event('beforeunload'))
    })

    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it('does not save on visibilitychange when disabled', () => {
    renderHook(() =>
      useSessionPersistence({ ...baseOpts, enabled: false, cursorPosition: 1, startTime: 1000 }),
    )

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(mockSave).not.toHaveBeenCalled()
  })

  it('flush() triggers an immediate save', () => {
    const { result } = renderHook(() =>
      useSessionPersistence({ ...baseOpts, cursorPosition: 2, startTime: 1000 }),
    )

    act(() => {
      result.current.flush()
    })

    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(mockSave).toHaveBeenCalledWith(
      'test-book', 0, 0, 2,
      [CharState.UNTYPED, CharState.UNTYPED, CharState.UNTYPED],
      1000, 0, 'abc',
    )
  })

  it('flush() does not save when nothing has been typed', () => {
    const { result } = renderHook(() =>
      useSessionPersistence(baseOpts),
    )

    act(() => {
      result.current.flush()
    })

    expect(mockSave).not.toHaveBeenCalled()
  })


  it('calls getElapsedMs during flush and passes result to saveTypingSession', () => {
    const getElapsedMs = vi.fn().mockReturnValue(5000)
    const { result } = renderHook(() =>
      useSessionPersistence({ ...baseOpts, cursorPosition: 1, startTime: 1000, getElapsedMs }),
    )

    act(() => {
      result.current.flush()
    })

    expect(getElapsedMs).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalledWith(
      'test-book', 0, 0, 1,
      [CharState.UNTYPED, CharState.UNTYPED, CharState.UNTYPED],
      1000, 5000, 'abc',
    )
  })
  it('removes event listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() =>
      useSessionPersistence({ ...baseOpts, cursorPosition: 1, startTime: 1000 }),
    )
    unmount()

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(windowRemoveSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    removeSpy.mockRestore()
    windowRemoveSpy.mockRestore()
  })
})
