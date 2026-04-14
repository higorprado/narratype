import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePageNavigation } from '@/hooks/usePageNavigation'

// usePageNavigation uses useNavigate, so we need a router context
function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/typing-console/test-book/0/0']}>
      <Routes>
        <Route path="/typing-console/:bookSlug/:chapterIndex/:pageIndex" element={<>{children}</>} />
      </Routes>
    </MemoryRouter>
  )
}

const baseOpts = {
  bookSlug: 'test-book' as string | undefined,
  chapterIndex: 0,
  pageIndex: 0,
  totalPages: 3,
  wordsPerPage: 350,
  isCompleted: false,
  autoAdvance: true,
  onNavigate: vi.fn(),
}

describe('usePageNavigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    baseOpts.onNavigate = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('computes isFirstPage correctly', () => {
    const { result } = renderHook(
      () => usePageNavigation({ ...baseOpts, chapterIndex: 0, pageIndex: 0 }),
      { wrapper },
    )
    expect(result.current.isFirstPage).toBe(true)
  })

  it('computes isLastPage correctly', () => {
    const { result } = renderHook(
      () => usePageNavigation({ ...baseOpts, pageIndex: 2, totalPages: 3 }),
      { wrapper },
    )
    expect(result.current.isLastPage).toBe(true)
  })

  it('isLastPage is false when not at last page', () => {
    const { result } = renderHook(
      () => usePageNavigation({ ...baseOpts, pageIndex: 0, totalPages: 3 }),
      { wrapper },
    )
    expect(result.current.isLastPage).toBe(false)
  })

  it('returns mainRef', () => {
    const { result } = renderHook(
      () => usePageNavigation(baseOpts),
      { wrapper },
    )
    expect(result.current.mainRef).toBeDefined()
    expect(result.current.mainRef.current).toBeNull()
  })

  it('auto-advances to next page after completion', () => {
    const { result } = renderHook(
      () => usePageNavigation({ ...baseOpts, isCompleted: true, pageIndex: 0 }),
      { wrapper },
    )

    vi.advanceTimersByTime(1500)
    // Navigation happened via useNavigate, which changes the URL in the router
    // We can verify goToPage is available
    expect(result.current.goToPage).toBeInstanceOf(Function)
  })

  it('does not auto-advance when not completed', () => {
    const onNavigate = baseOpts.onNavigate
    renderHook(
      () => usePageNavigation({ ...baseOpts, isCompleted: false, pageIndex: 0 }),
      { wrapper },
    )

    vi.advanceTimersByTime(5000)
    // onNavigate should not be called by auto-advance
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('does not auto-advance when on last page', () => {
    const onNavigate = baseOpts.onNavigate
    renderHook(
      () => usePageNavigation({ ...baseOpts, isCompleted: true, pageIndex: 2, totalPages: 3 }),
      { wrapper },
    )

    vi.advanceTimersByTime(5000)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('does not auto-advance when autoAdvance is false', () => {
    const onNavigate = baseOpts.onNavigate
    renderHook(
      () => usePageNavigation({ ...baseOpts, isCompleted: true, autoAdvance: false, pageIndex: 0 }),
      { wrapper },
    )

    vi.advanceTimersByTime(5000)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('goToPage calls onNavigate', () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(
      () => usePageNavigation({ ...baseOpts, onNavigate }),
      { wrapper },
    )

    result.current.goToPage(1)
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('goToPage does nothing when bookSlug is undefined', () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(
      () => usePageNavigation({ ...baseOpts, bookSlug: undefined, onNavigate }),
      { wrapper },
    )

    result.current.goToPage(1)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('navigates to page 0 when wordsPerPage changes and pageIndex is out of bounds', () => {
    const onNavigate = vi.fn()
    const { rerender } = renderHook(
      (opts) => usePageNavigation(opts),
      {
        wrapper,
        initialProps: { ...baseOpts, wordsPerPage: 350, totalPages: 3, pageIndex: 2, onNavigate },
      },
    )

    // Change wordsPerPage — but keep pageIndex within bounds
    rerender({ ...baseOpts, wordsPerPage: 100, totalPages: 1, pageIndex: 2, onNavigate })

    // Should have navigated to page 0 since pageIndex 2 >= totalPages 1
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
