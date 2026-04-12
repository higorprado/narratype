import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

describe('useDocumentTitle', () => {
  it('sets document.title to provided value', () => {
    renderHook(() => useDocumentTitle('Test Page'))
    expect(document.title).toBe('Test Page')
  })

  it('restores title on unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Test Page'))
    unmount()
    expect(document.title).toBe('Narratype')
  })

  it('updates when title changes', () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) => useDocumentTitle(title),
      { initialProps: { title: 'First Title' } },
    )
    expect(document.title).toBe('First Title')

    rerender({ title: 'Second Title' })
    expect(document.title).toBe('Second Title')
  })
})
