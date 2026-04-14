import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsProvider } from '@/context/SettingsContext'
import SettingsModal from '../../components/SettingsModal'

function renderModal(isOpen = true) {
  const onClose = vi.fn()
  render(
    <SettingsProvider>
      <SettingsModal isOpen={isOpen} onClose={onClose} />
    </SettingsProvider>,
  )
  return { onClose }
}

describe('SettingsModal', () => {
  it('renders nothing when isOpen is false', () => {
    renderModal(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    renderModal(true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const { onClose } = renderModal(true)
    fireEvent.click(screen.getByLabelText('Close settings'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const { onClose } = renderModal(true)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows Functionality tab by default', () => {
    renderModal(true)
    expect(screen.getByText('Smooth Cursor')).toBeInTheDocument()
  })

  it('shows Themes tab when clicked', async () => {
    const user = userEvent.setup()
    renderModal(true)

    await user.click(screen.getByRole('button', { name: 'Themes' }))
    expect(screen.getByText('catppuccin-mocha')).toBeInTheDocument()
    expect(screen.getByText('ocean')).toBeInTheDocument()
  })

  it('shows Fonts tab when clicked', async () => {
    const user = userEvent.setup()
    renderModal(true)

    await user.click(screen.getByRole('button', { name: 'Fonts' }))
    expect(screen.getByText('literata')).toBeInTheDocument()
    expect(screen.getByText('fira-code')).toBeInTheDocument()
  })

  it('toggle changes setting value', async () => {
    const user = userEvent.setup()
    function Wrapper() {
      return (
        <SettingsProvider>
          <SettingsModal isOpen={true} onClose={() => {}} />
        </SettingsProvider>
      )
    }

    render(<Wrapper />)

    const toggle = screen.getByLabelText('Reading Mode') as HTMLInputElement
    expect(toggle.checked).toBe(false)

    await user.click(toggle)
    expect(toggle.checked).toBe(true)
  })

  it('closes on ESC key', () => {
    const onClose = vi.fn()
    render(
      <SettingsProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </SettingsProvider>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('switches theme when ocean swatch is clicked', async () => {
    const user = userEvent.setup()
    renderModal(true)

    await user.click(screen.getByRole('button', { name: 'Themes' }))
    const oceanBtn = screen.getByRole('button', { name: /Aa ocean/ })

    // Default theme is classic-dark; ocean swatch should not be active yet
    expect(oceanBtn.className).not.toContain('themeSwatchActive')

    await user.click(oceanBtn)
    expect(oceanBtn.className).toContain('themeSwatchActive')
  })

  it('switches font when fira-code is clicked', async () => {
    const user = userEvent.setup()
    renderModal(true)

    await user.click(screen.getByRole('button', { name: 'Fonts' }))
    const firaBtn = screen.getByRole('button', { name: /^fira-code / })

    // Default font is literata; fira-code should not be active yet
    expect(firaBtn.className).not.toContain('fontItemActive')

    await user.click(firaBtn)
    expect(firaBtn.className).toContain('fontItemActive')
  })

  it('updates cursor style via select', async () => {
    const user = userEvent.setup()
    renderModal(true)

    const select = screen.getByLabelText('Cursor Style') as HTMLSelectElement
    expect(select.value).toBe('BOX')

    await user.selectOptions(select, 'LINE')
    expect(select.value).toBe('LINE')
  })

  it('updates stats frequency to page', async () => {
    const user = userEvent.setup()
    renderModal(true)

    // Default is 'word'; find the 'page' radio and click it
    const pageRadio = screen.getByRole('radio', { name: /page/i }) as HTMLInputElement
    expect(pageRadio.checked).toBe(false)

    await user.click(pageRadio)
    expect(pageRadio.checked).toBe(true)
  })


  it('reset button restores defaults', async () => {
    const user = userEvent.setup()

    function Wrapper() {
      return (
        <SettingsProvider>
          <SettingsModal isOpen={true} onClose={() => {}} />
        </SettingsProvider>
      )
    }

    render(<Wrapper />)

    // Toggle reading mode on
    const toggle = screen.getByLabelText('Reading Mode') as HTMLInputElement
    fireEvent.change(toggle, { target: { checked: true } })
    expect(toggle.checked).toBe(true)

    // Click reset
    await user.click(screen.getByText('Reset Defaults'))

    // After reset, toggle should be back to false
    expect((screen.getByLabelText('Reading Mode') as HTMLInputElement).checked).toBe(false)
  })
})
