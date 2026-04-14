import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EpubImportButton from '../EpubImportButton'

describe('EpubImportButton', () => {
  const onImport = vi.fn()
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    onImport.mockReset()
    clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    clickSpy.mockRestore()
  })

  it('renders "Import EPUB" button in idle state', () => {
    render(<EpubImportButton onImport={onImport} status="idle" error={null} />)
    expect(screen.getByRole('button', { name: 'Import EPUB' })).toBeInTheDocument()
  })

  it('shows "Importing..." when status is loading', () => {
    render(<EpubImportButton onImport={onImport} status="loading" error={null} />)
    expect(screen.getByRole('button', { name: 'Importing...' })).toBeInTheDocument()
  })

  it('button is disabled during loading', () => {
    render(<EpubImportButton onImport={onImport} status="loading" error={null} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('displays error message when error is provided', () => {
    render(<EpubImportButton onImport={onImport} status="idle" error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('does not show error when error is null', () => {
    render(<EpubImportButton onImport={onImport} status="idle" error={null} />)
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('clicking button triggers file input click', () => {
    render(<EpubImportButton onImport={onImport} status="idle" error={null} />)
    fireEvent.click(screen.getByRole('button'))
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('selecting a file calls onImport', async () => {
    onImport.mockResolvedValue(undefined)
    render(<EpubImportButton onImport={onImport} status="idle" error={null} />)
    const file = new File(['content'], 'book.epub', { type: 'application/epub+zip' })
    const input = screen.getByLabelText('Select EPUB file') as HTMLInputElement
    await fireEvent.change(input, { target: { files: [file] } })
    expect(onImport).toHaveBeenCalledOnce()
    expect(onImport).toHaveBeenCalledWith(file)
  })

  it('input accepts .epub files', () => {
    render(<EpubImportButton onImport={onImport} status="idle" error={null} />)
    const input = screen.getByLabelText('Select EPUB file') as HTMLInputElement
    expect(input.accept).toBe('.epub')
  })
})
