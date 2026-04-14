import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImportConfigModal from '../ImportConfigModal'

describe('ImportConfigModal', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <ImportConfigModal
        isOpen={false}
        fileName="test.pdf"
        defaultWordsPerChapter={1750}
        wordsPerPage={350}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders modal with file name and default config when open', () => {
    render(
      <ImportConfigModal
        isOpen={true}
        fileName="my-book.pdf"
        defaultWordsPerChapter={1750}
        wordsPerPage={350}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('my-book.pdf')).toBeInTheDocument()
    expect(screen.getByText('1,750')).toBeInTheDocument()
  })

  it('shows estimated pages based on wordsPerPage setting', () => {
    render(
      <ImportConfigModal
        isOpen={true}
        fileName="test.pdf"
        defaultWordsPerChapter={1750}
        wordsPerPage={350}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    // 1750 / 350 = 5 pages
    expect(screen.getByText(/~5 pages per chapter/)).toBeInTheDocument()
    expect(screen.getByText(/350 words per page/)).toBeInTheDocument()
  })

  it('calls onConfirm with configured wordsPerChapter when Import is clicked', () => {
    render(
      <ImportConfigModal
        isOpen={true}
        fileName="test.pdf"
        defaultWordsPerChapter={1750}
        wordsPerPage={350}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(onConfirm).toHaveBeenCalledWith(1750)
  })

  it('calls onCancel when Cancel is clicked', () => {
    render(
      <ImportConfigModal
        isOpen={true}
        fileName="test.pdf"
        defaultWordsPerChapter={1750}
        wordsPerPage={350}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when overlay is clicked', () => {
    render(
      <ImportConfigModal
        isOpen={true}
        fileName="test.pdf"
        defaultWordsPerChapter={1750}
        wordsPerPage={350}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    // The overlay has role="dialog" and onClick={onCancel}
    // Click directly on the overlay element (not on the inner modal)
    const overlay = screen.getByRole('dialog')
    fireEvent.click(overlay)
    expect(onCancel).toHaveBeenCalled()
  })

  it('updates estimated pages when slider changes', () => {
    render(
      <ImportConfigModal
        isOpen={true}
        fileName="test.pdf"
        defaultWordsPerChapter={1750}
        wordsPerPage={350}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: 3500 } })

    // 3500 / 350 = 10 pages
    expect(screen.getByText(/~10 pages per chapter/)).toBeInTheDocument()
    expect(screen.getByText('3,500')).toBeInTheDocument()
  })

  it('shows singular "page" when estimate is 1', () => {
    render(
      <ImportConfigModal
        isOpen={true}
        fileName="test.pdf"
        defaultWordsPerChapter={100}
        wordsPerPage={350}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    // 100 / 350 = ~1 page
    expect(screen.getByText(/~1 page per chapter/)).toBeInTheDocument()
  })
})
