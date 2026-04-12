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
    expect(screen.getByText('classic-dark')).toBeInTheDocument()
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
