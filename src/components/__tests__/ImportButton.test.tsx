import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportButton from '../ImportButton'
import { SettingsProvider } from '@/context/SettingsContext'

describe('ImportButton', () => {
  const onImport = vi.fn()
  let clickSpy: ReturnType<typeof vi.spyOn>

  function renderButton() {
    return render(
      <SettingsProvider>
        <ImportButton onImport={onImport} status="idle" error={null} />
      </SettingsProvider>,
    )
  }

  beforeEach(() => {
    onImport.mockReset()
    clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    clickSpy.mockRestore()
  })

  it('renders "Import Book" button in idle state', () => {
    renderButton()
    expect(screen.getByRole('button', { name: 'Import Book' })).toBeInTheDocument()
  })

  it('shows "Importing..." when status is loading', () => {
    render(
      <SettingsProvider>
        <ImportButton onImport={onImport} status="loading" error={null} />
      </SettingsProvider>,
    )
    expect(screen.getByRole('button', { name: 'Importing...' })).toBeInTheDocument()
  })

  it('button is disabled during loading', () => {
    render(
      <SettingsProvider>
        <ImportButton onImport={onImport} status="loading" error={null} />
      </SettingsProvider>,
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('displays error message when error is provided', () => {
    render(
      <SettingsProvider>
        <ImportButton onImport={onImport} status="idle" error="Something went wrong" />
      </SettingsProvider>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('does not show error when error is null', () => {
    renderButton()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('clicking button triggers file input click', () => {
    renderButton()
    fireEvent.click(screen.getByRole('button'))
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('selecting an EPUB file calls onImport directly', async () => {
    onImport.mockResolvedValue(undefined)
    renderButton()
    const file = new File(['content'], 'book.epub', { type: 'application/epub+zip' })
    const input = screen.getByLabelText('Select book file') as HTMLInputElement
    await fireEvent.change(input, { target: { files: [file] } })
    expect(onImport).toHaveBeenCalledOnce()
    expect(onImport).toHaveBeenCalledWith(file)
  })

  it('selecting a PDF file shows config modal instead of importing', async () => {
    onImport.mockResolvedValue(undefined)
    renderButton()
    const file = new File(['content'], 'book.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText('Select book file') as HTMLInputElement
    await fireEvent.change(input, { target: { files: [file] } })

    // Config modal should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('book.pdf')).toBeInTheDocument()
    // onImport NOT called yet
    expect(onImport).not.toHaveBeenCalled()
  })

  it('configuring PDF import and clicking Import calls onImport', async () => {
    onImport.mockResolvedValue(undefined)
    renderButton()
    const file = new File(['content'], 'book.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText('Select book file') as HTMLInputElement
    await fireEvent.change(input, { target: { files: [file] } })

    // Click Import in config modal
    const importBtn = screen.getByRole('button', { name: 'Import' })
    await fireEvent.click(importBtn)

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledOnce()
    })
    expect(onImport).toHaveBeenCalledWith(file, { wordsPerChapter: 1750 })
  })

  it('cancelling config modal does not call onImport', async () => {
    renderButton()
    const file = new File(['content'], 'book.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText('Select book file') as HTMLInputElement
    await fireEvent.change(input, { target: { files: [file] } })

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    await fireEvent.click(cancelBtn)

    expect(onImport).not.toHaveBeenCalled()
  })

  it('input accepts both .epub and .pdf files', () => {
    renderButton()
    const input = screen.getByLabelText('Select book file') as HTMLInputElement
    expect(input.accept).toBe('.epub,.pdf')
  })
})
