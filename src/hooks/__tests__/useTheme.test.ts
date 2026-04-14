import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeName } from '@/types'

describe('useTheme', () => {
  it('sets data-theme attribute on document element', () => {
    renderHook(() => useTheme('ocean' as ThemeName))
    expect(document.documentElement.getAttribute('data-theme')).toBe('ocean')
  })

  it('updates data-theme when theme changes', () => {
    const { rerender } = renderHook(
      ({ theme }: { theme: ThemeName }) => useTheme(theme),
      { initialProps: { theme: 'catppuccin-mocha' as ThemeName } },
    )
    expect(document.documentElement.getAttribute('data-theme')).toBe('catppuccin-mocha')

    rerender({ theme: 'pulse' as ThemeName })
    expect(document.documentElement.getAttribute('data-theme')).toBe('pulse')
  })
})
