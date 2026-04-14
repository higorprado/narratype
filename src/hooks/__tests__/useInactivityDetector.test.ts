import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInactivityDetector } from '@/hooks/useInactivityDetector'

describe('useInactivityDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires onInactive after timeout', () => {
    const onInactive = vi.fn()
    const onResume = vi.fn()

    renderHook(() =>
      useInactivityDetector({
        enabled: true,
        triggerPosition: 0,
        inactivityTimeoutSeconds: 5,
        onInactive,
        onResume,
        paused: false,
      }),
    )

    expect(onInactive).not.toHaveBeenCalled()
    vi.advanceTimersByTime(5000)
    expect(onInactive).toHaveBeenCalledTimes(1)
    expect(onInactive).toHaveBeenCalledWith(expect.any(Number))
  })

  it('does not fire onInactive when disabled', () => {
    const onInactive = vi.fn()
    const onResume = vi.fn()

    renderHook(() =>
      useInactivityDetector({
        enabled: false,
        triggerPosition: 0,
        inactivityTimeoutSeconds: 5,
        onInactive,
        onResume,
        paused: false,
      }),
    )

    vi.advanceTimersByTime(5000)
    expect(onInactive).not.toHaveBeenCalled()
  })

  it('does not fire onInactive when paused', () => {
    const onInactive = vi.fn()
    const onResume = vi.fn()

    renderHook(() =>
      useInactivityDetector({
        enabled: true,
        triggerPosition: 0,
        inactivityTimeoutSeconds: 5,
        onInactive,
        onResume,
        paused: true,
      }),
    )

    vi.advanceTimersByTime(5000)
    expect(onInactive).not.toHaveBeenCalled()
  })

  it('restarts timer when triggerPosition changes', () => {
    const onInactive = vi.fn()
    const onResume = vi.fn()

    const { rerender } = renderHook(
      (props) =>
        useInactivityDetector({
          enabled: true,
          triggerPosition: props.position,
          inactivityTimeoutSeconds: 5,
          onInactive,
          onResume,
          paused: false,
        }),
      { initialProps: { position: 0 } },
    )

    // Advance 3 seconds, then trigger a new keystroke
    vi.advanceTimersByTime(3000)
    rerender({ position: 1 })

    // Advance another 3 seconds — total 6s but timer was reset at 3s
    vi.advanceTimersByTime(3000)
    expect(onInactive).not.toHaveBeenCalled()

    // Advance the remaining 2s (5s since last triggerPosition change)
    vi.advanceTimersByTime(2000)
    expect(onInactive).toHaveBeenCalledTimes(1)
  })

  it('calls onResume when resuming from idle', () => {
    const onInactive = vi.fn()
    const onResume = vi.fn()

    const { rerender } = renderHook(
      (props) =>
        useInactivityDetector({
          enabled: true,
          triggerPosition: props.position,
          inactivityTimeoutSeconds: 5,
          onInactive,
          onResume,
          paused: false,
        }),
      { initialProps: { position: 0 } },
    )

    // Let timer fire — goes idle
    vi.advanceTimersByTime(5000)
    expect(onInactive).toHaveBeenCalledTimes(1)

    // New keystroke — should resume
    rerender({ position: 1 })
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('handlePause clears timer and sets isIdle', () => {
    const onInactive = vi.fn()
    const onResume = vi.fn()

    const { result } = renderHook(() =>
      useInactivityDetector({
        enabled: true,
        triggerPosition: 0,
        inactivityTimeoutSeconds: 5,
        onInactive,
        onResume,
        paused: false,
      }),
    )

    act(() => {
      result.current.handlePause()
    })

    // Timer should be cleared — no inactivity callback
    vi.advanceTimersByTime(10000)
    expect(onInactive).not.toHaveBeenCalled()
    expect(result.current.isIdleRef.current).toBe(true)
  })

  it('cleans up timer on unmount', () => {
    const onInactive = vi.fn()
    const onResume = vi.fn()

    const { unmount } = renderHook(() =>
      useInactivityDetector({
        enabled: true,
        triggerPosition: 0,
        inactivityTimeoutSeconds: 5,
        onInactive,
        onResume,
        paused: false,
      }),
    )

    unmount()

    // Timer should be cleaned up — no inactivity callback
    vi.advanceTimersByTime(10000)
    expect(onInactive).not.toHaveBeenCalled()
  })

  it('lastKeystrokeTimeRef is set to current time on each trigger', () => {
    const onInactive = vi.fn()
    const onResume = vi.fn()
    const now = 1000000
    vi.setSystemTime(now)

    const { result } = renderHook(() =>
      useInactivityDetector({
        enabled: true,
        triggerPosition: 0,
        inactivityTimeoutSeconds: 5,
        onInactive,
        onResume,
        paused: false,
      }),
    )

    expect(result.current.lastKeystrokeTimeRef.current).toBe(now)
  })
})
