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

  it('calls onStatsUpdate after typing starts', () => {
    const onStatsUpdate = vi.fn()
    render(<TypingArea text="test" onStatsUpdate={onStatsUpdate} />)
    const area = screen.getByTestId('typing-area')

    fireEvent.keyDown(area, { key: 't' })

    expect(onStatsUpdate).toHaveBeenCalled()
  })
})
