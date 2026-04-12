import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useFont } from '@/hooks/useFont'
import type { FontName } from '@/types'

describe('useFont', () => {
  it('sets --font-family CSS variable on document element', () => {
    renderHook(() => useFont('literata' as FontName))
    expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
      '"Literata", Georgia, serif',
    )
  })

  it('updates --font-family when font changes', () => {
    const { rerender } = renderHook(
      ({ font }: { font: FontName }) => useFont(font),
      { initialProps: { font: 'literata' as FontName } },
    )
    expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
      '"Literata", Georgia, serif',
    )

    rerender({ font: 'fira-code' as FontName })
    expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
      '"Fira Code", monospace',
    )
  })

  it('maps each font name to the correct font-family string', () => {
    const testCases: [FontName, string][] = [
      ['literata', '"Literata", Georgia, serif'],
      ['hyperlegible', '"Atkinson Hyperlegible", sans-serif'],
      ['open-dyslexic', '"OpenDyslexic", sans-serif'],
      ['fira-code', '"Fira Code", monospace'],
      ['courier-prime', '"Courier Prime", monospace'],
      ['lora', '"Lora", Georgia, serif'],
      ['bitter', '"Bitter", serif'],
      ['comic-sans', '"Comic Sans MS", cursive'],
    ]

    for (const [font, expected] of testCases) {
      const { unmount } = renderHook(() => useFont(font))
      expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(expected)
      unmount()
    }
  })
})
