import { render, screen, fireEvent } from '@testing-library/react'
import TypingArea from '../../components/TypingArea'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

describe('TypingArea', () => {
  it('renders all characters from the text', () => {
    render(<TypingArea text="abc" />)
    const spans = screen.getAllByTestId('char-span')
    expect(spans).toHaveLength(3)
    expect(spans[0]).toHaveTextContent('a')
    expect(spans[1]).toHaveTextContent('b')
    expect(spans[2]).toHaveTextContent('c')
  })

  it('marks characters as correct on matching keypress', () => {
    render(<TypingArea text="hi" />)
    const area = screen.getByTestId('typing-area')

    fireEvent.keyDown(area, { key: 'h' })

    const spans = screen.getAllByTestId('char-span')
    expect(spans[0].className).toContain('correct')
    expect(spans[1].className).toContain('untyped')
  })

  it('marks characters as incorrect on wrong keypress', () => {
    render(<TypingArea text="hi" />)
    const area = screen.getByTestId('typing-area')

    fireEvent.keyDown(area, { key: 'x' })

    const spans = screen.getAllByTestId('char-span')
    expect(spans[0].className).toContain('incorrect')
  })

  it('calls onComplete when all characters are typed correctly', () => {
    const onComplete = vi.fn()
    render(<TypingArea text="ab" onComplete={onComplete} />)
    const area = screen.getByTestId('typing-area')

    fireEvent.keyDown(area, { key: 'a' })
    fireEvent.keyDown(area, { key: 'b' })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not call onComplete when characters remain', () => {
    const onComplete = vi.fn()
    render(<TypingArea text="ab" onComplete={onComplete} />)
    const area = screen.getByTestId('typing-area')

    fireEvent.keyDown(area, { key: 'a' })

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('shows empty message for empty text', () => {
    render(<TypingArea text="" />)
    expect(screen.getByText('No text to type.')).toBeInTheDocument()
  })

  it('splits paragraphs on double newlines', () => {
    render(<TypingArea text={'hello\n\nworld'} />)
    const paragraphs = screen.getByTestId('typing-area').querySelectorAll('p')
    expect(paragraphs.length).toBe(2)
  })

  it('calls onStatsUpdate at word boundary with default word frequency', () => {
    const onStatsUpdate = vi.fn()
    render(<TypingArea text="hi world" onStatsUpdate={onStatsUpdate} />)
    const area = screen.getByTestId('typing-area')

    // Type 'h' — no stats yet (not a word boundary)
    fireEvent.keyDown(area, { key: 'h' })
    expect(onStatsUpdate).not.toHaveBeenCalled()

    // Type 'i' — still no stats
    fireEvent.keyDown(area, { key: 'i' })
    expect(onStatsUpdate).not.toHaveBeenCalled()

    // Type ' ' (space) — word boundary crossed, stats should fire
    fireEvent.keyDown(area, { key: ' ' })
    expect(onStatsUpdate).toHaveBeenCalledTimes(1)
  })

  it('handles dead key followed by space as the base character', () => {
    render(<TypingArea text="a'b" />)
    const area = screen.getByTestId('typing-area')

    // Type 'a' normally first
    fireEvent.keyDown(area, { key: 'a' })

    const spansAfterA = screen.getAllByTestId('char-span')
    expect(spansAfterA[0].className).toContain('correct')

    // Simulate dead key ' then space
    fireEvent.keyDown(area, { key: 'Dead', code: 'Quote' })
    fireEvent.keyDown(area, { key: ' ' })

    const spans = screen.getAllByTestId('char-span')
    // After 'a' and dead+' → space, cursor should be at index 2 (the 'b')
    // The apostrophe at index 1 should be correct
    expect(spans[1].textContent).toBe("'")
    expect(spans[1].className).toContain('correct')

  })
  it('calls onInactivity on blur after typing', () => {
    const onInactivity = vi.fn()
    render(<TypingArea text="hi" onInactivity={onInactivity} />)
    const area = screen.getByTestId('typing-area')

    fireEvent.focus(area)
    fireEvent.keyDown(area, { key: 'h' })
    fireEvent.blur(area)

    expect(onInactivity).toHaveBeenCalledTimes(1)
  })

  it('does not call onInactivity on blur when not started', () => {
    const onInactivity = vi.fn()
    render(<TypingArea text="hi" onInactivity={onInactivity} />)
    const area = screen.getByTestId('typing-area')

    fireEvent.focus(area)
    // Blur without typing anything
    fireEvent.blur(area)

    expect(onInactivity).not.toHaveBeenCalled()
  })

  it('does not call onInactivity on blur when already complete', () => {
    const onInactivity = vi.fn()
    render(<TypingArea text="ab" onInactivity={onInactivity} />)
    const area = screen.getByTestId('typing-area')

    fireEvent.focus(area)
    fireEvent.keyDown(area, { key: 'a' })
    fireEvent.keyDown(area, { key: 'b' })
    // Session is complete now
    fireEvent.blur(area)

    expect(onInactivity).not.toHaveBeenCalled()
  })

  it('calls onStatsUpdate with frozen stats on blur', () => {
    const onStatsUpdate = vi.fn()
    render(<TypingArea text="hi" onStatsUpdate={onStatsUpdate} />)
    const area = screen.getByTestId('typing-area')

    fireEvent.focus(area)
    fireEvent.keyDown(area, { key: 'h' })
    fireEvent.blur(area)

    expect(onStatsUpdate).toHaveBeenCalledTimes(1)
    // Verify it has the expected stats shape
    const stats = onStatsUpdate.mock.calls[0][0]
    expect(stats).toHaveProperty('wpm')
    expect(stats).toHaveProperty('accuracy')
  })

  it('shows cursor overlay when focused and hides on blur', () => {
    render(<TypingArea text="hi" />)
    const area = screen.getByTestId('typing-area')

    fireEvent.focus(area)
    // After focus: overlay div exists
    expect(area.querySelector(':scope > div')).not.toBeNull()

    fireEvent.blur(area)
    // After blur: overlay is gone
    expect(area.querySelector(':scope > div')).toBeNull()
  })

  it('clears inactivity timer on unmount without errors', () => {
    vi.useFakeTimers()
    const { unmount } = render(
      <TypingArea text="hi" inactivityTimeout={1000} />
    )
    const area = screen.getByTestId('typing-area')

    fireEvent.focus(area)
    fireEvent.keyDown(area, { key: 'h' })

    // Unmount while timer is pending
    expect(() => unmount()).not.toThrow()
    vi.useRealTimers()
  })


  it('reading mode marks all chars as correct', () => {
    render(<TypingArea text="abc" readingMode={true} />)
    const spans = screen.getAllByTestId('char-span')
    expect(spans).toHaveLength(3)
    for (const span of spans) {
      expect(span.className).toContain('correct')
    }
  })

  it('reading mode hides cursor overlay and has no tabIndex', () => {
    render(<TypingArea text="abc" readingMode={true} />)
    const area = screen.getByTestId('typing-area')
    // No overlay div (cursor hidden)
    expect(area.querySelector(':scope > div')).toBeNull()
    // tabIndex should be undefined in reading mode
    expect(area.getAttribute('tabindex')).toBeNull()
  })

  it('statsUpdateFrequency=page only reports stats on completion', () => {
    const onStatsUpdate = vi.fn()
    render(<TypingArea text="ab" onStatsUpdate={onStatsUpdate} statsUpdateFrequency="page" />)
    const area = screen.getByTestId('typing-area')

    // Type first char — stats should NOT fire
    fireEvent.keyDown(area, { key: 'a' })
    expect(onStatsUpdate).not.toHaveBeenCalled()

    // Type second char (completing) — stats SHOULD fire
    fireEvent.keyDown(area, { key: 'b' })
    expect(onStatsUpdate).toHaveBeenCalledTimes(1)
  })

})