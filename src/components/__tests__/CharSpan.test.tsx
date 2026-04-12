import { render, screen } from '@testing-library/react'
import { CharState } from '@/types'
import CharSpan from '../../components/CharSpan'

describe('CharSpan', () => {
  it('renders a regular character', () => {
    render(<CharSpan char="a" state={CharState.UNTYPED} isCursor={false} />)
    expect(screen.getByTestId('char-span')).toHaveTextContent('a')
  })

  it('applies untyped class for UNTYPED state', () => {
    render(<CharSpan char="x" state={CharState.UNTYPED} isCursor={false} />)
    const el = screen.getByTestId('char-span')
    expect(el.className).toContain('untyped')
  })

  it('applies correct class for CORRECT state', () => {
    render(<CharSpan char="x" state={CharState.CORRECT} isCursor={false} />)
    const el = screen.getByTestId('char-span')
    expect(el.className).toContain('correct')
  })

  it('applies incorrect class for INCORRECT state', () => {
    render(<CharSpan char="x" state={CharState.INCORRECT} isCursor={false} />)
    const el = screen.getByTestId('char-span')
    expect(el.className).toContain('incorrect')
  })

  it('applies cursor class when isCursor is true', () => {
    render(<CharSpan char="a" state={CharState.UNTYPED} isCursor={true} />)
    const el = screen.getByTestId('char-span')
    expect(el.className).toContain('cursor')
  })

  it('does not apply cursor class when isCursor is false', () => {
    render(<CharSpan char="a" state={CharState.UNTYPED} isCursor={false} />)
    const el = screen.getByTestId('char-span')
    expect(el.className).not.toContain('cursor')
  })

  it('renders newline as return symbol', () => {
    render(<CharSpan char={'\n'} state={CharState.UNTYPED} isCursor={false} />)
    expect(screen.getByTestId('char-span')).toHaveTextContent('↵')
  })

  it('renders space character as-is', () => {
    render(<CharSpan char=" " state={CharState.UNTYPED} isCursor={false} />)
    const el = screen.getByTestId('char-span')
    expect(el.textContent).toBe(' ')
  })
})
