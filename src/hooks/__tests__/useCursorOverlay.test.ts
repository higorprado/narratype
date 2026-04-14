import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCursorOverlay } from '@/hooks/useCursorOverlay'
import { CharState } from '@/types'

// jsdom doesn't implement getBoundingClientRect
const mockGetBoundingClientRect = () => ({
  left: 10,
  top: 20,
  right: 30,
  bottom: 40,
  width: 20,
  height: 24,
  x: 10,
  y: 20,
  toJSON: () => {},
})

function createMockRef<T>(value: T): React.RefObject<T> {
  return { current: value }
}

const defaultChars = [
  { char: 'a', state: CharState.UNTYPED },
  { char: 'b', state: CharState.UNTYPED },
]

describe('useCursorOverlay', () => {
  it('returns an overlayRef', () => {
    const cursorRef = createMockRef(document.createElement('span'))
    const containerRef = createMockRef(document.createElement('div'))

    const { result } = renderHook(() =>
      useCursorOverlay({
        cursorRef,
        containerRef,
        cursorPosition: 0,
        chars: defaultChars,
        isFocused: true,
        text: 'ab',
      }),
    )

    expect(result.current.overlayRef).toBeDefined()
    expect(result.current.overlayRef.current).toBeNull() // not attached to DOM
  })

  it('positions overlay when refs are attached to DOM elements', () => {
    const cursorSpan = document.createElement('span')
    const containerDiv = document.createElement('div')
    const overlayDiv = document.createElement('div')

    cursorSpan.getBoundingClientRect = mockGetBoundingClientRect
    containerDiv.getBoundingClientRect = mockGetBoundingClientRect

    // Simulate React attaching the overlay ref
    const cursorRef = createMockRef(cursorSpan)
    const containerRef = createMockRef(containerDiv)

    // We need to set the overlayRef's current before the effect runs
    // renderHook can't do this directly, so we use a wrapper
    const { } = renderHook(() => {
      const hookResult = useCursorOverlay({
        cursorRef,
        containerRef,
        cursorPosition: 0,
        chars: defaultChars,
        isFocused: true,
        text: 'ab',
      })
      // Simulate the overlay being in the DOM
      hookResult.overlayRef.current = overlayDiv
      return hookResult
    })

    expect(overlayDiv.style.left).toBeDefined()
    expect(overlayDiv.style.width).toBe('20px')
  })

  it('does not crash when refs are null', () => {
    const nullRef = createMockRef<HTMLElement | null>(null)
    const nullDivRef = createMockRef<HTMLDivElement | null>(null)

    expect(() =>
      renderHook(() =>
        useCursorOverlay({
          cursorRef: nullRef,
          containerRef: nullDivRef,
          cursorPosition: 0,
          chars: defaultChars,
          isFocused: true,
          text: 'ab',
        }),
      ),
    ).not.toThrow()
  })
})
