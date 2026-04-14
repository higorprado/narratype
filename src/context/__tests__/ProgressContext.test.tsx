import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import { ProgressProvider, useProgress } from '../ProgressContext'

describe('ProgressContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders children', () => {
    render(
      <ProgressProvider>
        <p>Hello</p>
      </ProgressProvider>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('markPageComplete saves to progress map', () => {
    function Reader() {
      const { markPageComplete, getProgress } = useProgress()
      const prog = getProgress('test-book')
      return (
        <>
          <span data-testid="pages">
            {prog?.chapters[0]?.join(',') ?? 'none'}
          </span>
          <button onClick={() => markPageComplete('test-book', 0, 2)}>mark</button>
        </>
      )
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    expect(screen.getByTestId('pages')).toHaveTextContent('none')

    act(() => screen.getByText('mark').click())

    expect(screen.getByTestId('pages')).toHaveTextContent('2')
  })

  it('markPageComplete does not duplicate page entries', () => {
    function Reader() {
      const { markPageComplete, getProgress } = useProgress()
      const prog = getProgress('test-book')
      return (
        <>
          <span data-testid="pages">
            {prog?.chapters[0]?.join(',') ?? 'none'}
          </span>
          <button onClick={() => { markPageComplete('test-book', 0, 2); markPageComplete('test-book', 0, 2) }}>mark</button>
        </>
      )
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    act(() => screen.getByText('mark').click())

    expect(screen.getByTestId('pages')).toHaveTextContent('2')
  })

  it('getBookCompletionPercent calculates correctly', () => {
    function Reader() {
      const { markPageComplete, getBookCompletionPercent } = useProgress()
      return (
        <>
          <span data-testid="percent">{getBookCompletionPercent('the-call-of-cthulhu')}</span>
          <button onClick={() => markPageComplete('the-call-of-cthulhu', 0, 0)}>mark</button>
        </>
      )
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    expect(screen.getByTestId('percent')).toHaveTextContent('0')

    act(() => screen.getByText('mark').click())

    const percent = Number(screen.getByTestId('percent').textContent)
    expect(percent).toBeGreaterThan(0)
    expect(percent).toBeLessThanOrEqual(100)
  })

  it('getBookCompletionPercent returns 0 for unknown book', () => {
    function Reader() {
      const { getBookCompletionPercent } = useProgress()
      return <span data-testid="percent">{getBookCompletionPercent('unknown-book')}</span>
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    expect(screen.getByTestId('percent')).toHaveTextContent('0')
  })

  it('isPageComplete returns correct state', () => {
    function Reader() {
      const { markPageComplete, isPageComplete } = useProgress()
      return (
        <>
          <span data-testid="complete-before">{String(isPageComplete('test-book', 0, 1))}</span>
          <button onClick={() => markPageComplete('test-book', 0, 1)}>mark</button>
          <span data-testid="complete-after">{String(isPageComplete('test-book', 0, 1))}</span>
        </>
      )
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    expect(screen.getByTestId('complete-before')).toHaveTextContent('false')

    act(() => screen.getByText('mark').click())

    expect(screen.getByTestId('complete-after')).toHaveTextContent('true')
  })

  it('getRecentBooks returns sorted by lastAccessed', () => {
    function Reader() {
      const { markPageComplete, getRecentBooks } = useProgress()
      const recent = getRecentBooks()
      return (
        <>
          <span data-testid="recent">{recent.map((r) => r.bookSlug).join(',')}</span>
          <button onClick={() => markPageComplete('book-a', 0, 0)}>markA</button>
          <button onClick={() => markPageComplete('book-b', 0, 0)}>markB</button>
        </>
      )
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    act(() => screen.getByText('markA').click())
    act(() => { vi.advanceTimersByTime(1) })
    act(() => screen.getByText('markB').click())

    // Most recent first
    expect(screen.getByTestId('recent')).toHaveTextContent('book-b,book-a')
  })

  it('progress persists to localStorage', () => {
    function Reader() {
      const { markPageComplete } = useProgress()
      return <button onClick={() => markPageComplete('persist-book', 1, 3)}>mark</button>
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    act(() => screen.getByText('mark').click())

    const stored = JSON.parse(localStorage.getItem('narratype-progress')!)
    expect(stored['persist-book']).toBeDefined()
    expect(stored['persist-book'].chapters[1]).toContain(3)
  })

  it('loads saved progress from localStorage on mount', () => {
    const saved = {
      'saved-book': {
        chapters: { 0: [0, 1] },
        lastPage: { bookSlug: 'saved-book', chapterIndex: 0, pageIndex: 1 },
        lastAccessed: 1234567890,
      },
    }
    localStorage.setItem('narratype-progress', JSON.stringify(saved))

    function Reader() {
      const { getProgress } = useProgress()
      const prog = getProgress('saved-book')
      return <span data-testid="pages">{prog?.chapters[0]?.join(',') ?? 'none'}</span>
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    expect(screen.getByTestId('pages')).toHaveTextContent('0,1')
  })

  it('getLastPage returns null for unknown book', () => {
    function Reader() {
      const { getLastPage } = useProgress()
      const last = getLastPage('unknown-book')
      return <span data-testid="last">{last === null ? 'null' : 'exists'}</span>
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    expect(screen.getByTestId('last')).toHaveTextContent('null')
  })

  it('setLastPage sets last page without marking complete', () => {
    function Reader() {
      const { setLastPage, getLastPage, getProgress } = useProgress()
      const last = getLastPage('test-book')
      const prog = getProgress('test-book')
      return (
        <>
          <span data-testid="last">{last ? `${last.chapterIndex}-${last.pageIndex}` : 'none'}</span>
          <span data-testid="pages">{prog?.chapters[0]?.join(',') ?? 'none'}</span>
          <button onClick={() => setLastPage('test-book', 2, 5)}>setLast</button>
        </>
      )
    }

    render(
      <ProgressProvider>
        <Reader />
      </ProgressProvider>,
    )

    act(() => screen.getByText('setLast').click())

    expect(screen.getByTestId('last')).toHaveTextContent('2-5')
    // No pages marked complete
    expect(screen.getByTestId('pages')).toHaveTextContent('none')
  })

  it('throws when useProgress is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BadReader() {
      useProgress()
      return <span>bad</span>
    }

    expect(() => render(<BadReader />)).toThrow('useProgress must be used within ProgressProvider')
    spy.mockRestore()
  })
})
