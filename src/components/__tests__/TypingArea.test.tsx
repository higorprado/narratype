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
})
