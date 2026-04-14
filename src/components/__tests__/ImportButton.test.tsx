import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImportButton from '../ImportButton'

describe('ImportButton', () => {
  const onImport = vi.fn()
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    onImport.mockReset()
    clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    clickSpy.mockRestore()
  })

  it('renders "Import Book" button in idle state', () => {
    render(<ImportButton onImport={onImport} status="idle" error={null} />)
    expect(screen.getByRole('button', { name: 'Import Book' })).toBeInTheDocument()
  })

  it('shows "Importing..." when status is loading', () => {
    render(<ImportButton onImport={onImport} status="loading" error={null} />)
    expect(screen.getByRole('button', { name: 'Importing...' })).toBeInTheDocument()
  })

  it('button is disabled during loading', () => {
    render(<ImportButton onImport={onImport} status="loading" error={null} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('displays error message when error is provided', () => {
    render(<ImportButton onImport={onImport} status="idle" error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('does not show error when error is null', () => {
    render(<ImportButton onImport={onImport} status="idle" error={null} />)
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('clicking button triggers file input click', () => {
    render(<ImportButton onImport={onImport} status="idle" error={null} />)
    fireEvent.click(screen.getByRole('button'))
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('selecting a file calls onImport', async () => {
    onImport.mockResolvedValue(undefined)
    render(<ImportButton onImport={onImport} status="idle" error={null} />)
    const file = new File(['content'], 'book.epub', { type: 'application/epub+zip' })
    const input = screen.getByLabelText('Select book file') as HTMLInputElement
    await fireEvent.change(input, { target: { files: [file] } })
    expect(onImport).toHaveBeenCalledOnce()
    expect(onImport).toHaveBeenCalledWith(file)
  })

  it('input accepts both .epub and .pdf files', () => {
    render(<ImportButton onImport={onImport} status="idle" error={null} />)
    const input = screen.getByLabelText('Select book file') as HTMLInputElement
    expect(input.accept).toBe('.epub,.pdf')
  })
})
