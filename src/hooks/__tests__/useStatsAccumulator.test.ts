import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStatsAccumulator } from '@/hooks/useStatsAccumulator'

describe('useStatsAccumulator', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    nowSpy.mockRestore()
  })

  it('returns correct initial state', () => {
    const { result } = renderHook(() => useStatsAccumulator())
    expect(result.current.getAllChars()).toBe(0)
    expect(result.current.getElapsedMs()).toBe(0)
    expect(result.current.isSessionActive()).toBe(false)
  })

  it('onCharTyped starts a session and sets sessionChars=1', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharTyped()
    })

    expect(result.current.isSessionActive()).toBe(true)
    expect(result.current.getAllChars()).toBe(1)
  })

  it('second onCharTyped increments sessionChars to 2', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharTyped()
      result.current.onCharTyped()
    })

    expect(result.current.getAllChars()).toBe(2)
  })

  it('onCharDeleted decrements sessionChars', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharTyped()
      result.current.onCharTyped()
      result.current.onCharDeleted()
    })

    expect(result.current.getAllChars()).toBe(1)
  })

  it('onCharDeleted does NOT go below 0', () => {
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharDeleted()
    })

    expect(result.current.getAllChars()).toBe(0)
  })

  it('onPause accumulates session into totals and resets session', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharTyped()
      result.current.onCharTyped()
    })

    // Pause at t=3000 → session lasted 2000ms
    act(() => {
      result.current.onPause(3000)
    })

    expect(result.current.getAllChars()).toBe(2)
    expect(result.current.isSessionActive()).toBe(false)
    expect(result.current.getElapsedMsAtTime(3000)).toBe(2000)
  })

  it('onPause without typing does nothing', () => {
    nowSpy.mockReturnValue(5000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onPause(5000)
    })

    expect(result.current.getAllChars()).toBe(0)
    expect(result.current.getElapsedMs()).toBe(0)
    expect(result.current.isSessionActive()).toBe(false)
  })

  it('multiple pause/resume cycles accumulate correctly', () => {
    const { result } = renderHook(() => useStatsAccumulator())

    // Session 1: 3 chars from t=1000 to t=3000
    nowSpy.mockReturnValue(1000)
    act(() => {
      result.current.onCharTyped()
      result.current.onCharTyped()
      result.current.onCharTyped()
    })
    act(() => {
      result.current.onPause(3000)
    })

    expect(result.current.getAllChars()).toBe(3)
    expect(result.current.getElapsedMsAtTime(3000)).toBe(2000)

    // Session 2: 2 chars from t=5000 to t=8000
    nowSpy.mockReturnValue(5000)
    act(() => {
      result.current.onCharTyped()
      result.current.onCharTyped()
    })
    act(() => {
      result.current.onPause(8000)
    })

    expect(result.current.getAllChars()).toBe(5)
    expect(result.current.getElapsedMsAtTime(8000)).toBe(5000) // 2000 + 3000
  })

  it('reset clears everything', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharTyped()
      result.current.onCharTyped()
      result.current.onPause(3000)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.getAllChars()).toBe(0)
    expect(result.current.getElapsedMs()).toBe(0)
    expect(result.current.isSessionActive()).toBe(false)
  })

  it('getElapsedMsAtTime returns correct value during active session', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharTyped()
    })

    // At t=5000, elapsed should be 4000ms
    expect(result.current.getElapsedMsAtTime(5000)).toBe(4000)
  })

  it('getElapsedMsAtTime returns totalTimeMs when no active session', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharTyped()
      result.current.onPause(4000)
    })

    // No active session → returns totalTimeMs regardless of timestamp
    expect(result.current.getElapsedMsAtTime(99999)).toBe(3000)
  })
  it('restore pre-populates totalChars and totalTimeMs without starting session', () => {
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.restore(25, 5000)
    })

    expect(result.current.getAllChars()).toBe(25)
    expect(result.current.getElapsedMsAtTime(10000)).toBe(5000)
    expect(result.current.isSessionActive()).toBe(false)
  })

  it('restore allows subsequent typing to accumulate on top', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.restore(25, 5000)
    })

    // New typing session starts from now
    act(() => {
      result.current.onCharTyped()
      result.current.onCharTyped()
    })

    expect(result.current.getAllChars()).toBe(27) // 25 restored + 2 new
    expect(result.current.isSessionActive()).toBe(true)

    // Pause at t=2000 — new session was 1000ms
    act(() => {
      result.current.onPause(2000)
    })

    expect(result.current.getElapsedMsAtTime(2000)).toBe(6000) // 5000 restored + 1000 new
    expect(result.current.getAllChars()).toBe(27)
  })

  it('restore resets session state (no dangling active session)', () => {
    nowSpy.mockReturnValue(1000)
    const { result } = renderHook(() => useStatsAccumulator())

    act(() => {
      result.current.onCharTyped()
    })

    expect(result.current.isSessionActive()).toBe(true)

    act(() => {
      result.current.restore(10, 3000)
    })

    expect(result.current.isSessionActive()).toBe(false)
    expect(result.current.getAllChars()).toBe(10)
  })
})
