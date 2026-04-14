import { render, screen, act } from '@testing-library/react'
import { SettingsProvider, useSettings } from '../SettingsContext'
import type { Settings } from '@/types'

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders children', () => {
    render(
      <SettingsProvider>
        <p>Hello</p>
      </SettingsProvider>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('provides default settings', () => {
    function Reader() {
      const { settings } = useSettings()
      return <span data-testid="theme">{settings.theme}</span>
    }

    render(
      <SettingsProvider>
        <Reader />
      </SettingsProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('catppuccin-mocha')
  })

  it('updateSetting changes the value', () => {
    function Reader() {
      const { settings, updateSetting } = useSettings()
      return (
        <>
          <span data-testid="font">{settings.font}</span>
          <button onClick={() => updateSetting('font', 'fira-code')}>change</button>
        </>
      )
    }

    render(
      <SettingsProvider>
        <Reader />
      </SettingsProvider>,
    )

    expect(screen.getByTestId('font')).toHaveTextContent('literata')
    act(() => screen.getByText('change').click())
    expect(screen.getByTestId('font')).toHaveTextContent('fira-code')
  })

  it('updateSetting persists to localStorage', () => {
    function Reader() {
      const { settings, updateSetting } = useSettings()
      return (
        <>
          <span data-testid="cursor">{settings.cursorStyle}</span>
          <button onClick={() => updateSetting('cursorStyle', 'LINE')}>change</button>
        </>
      )
    }

    render(
      <SettingsProvider>
        <Reader />
      </SettingsProvider>,
    )

    act(() => screen.getByText('change').click())

    const stored = JSON.parse(localStorage.getItem('narratype-settings')!)
    expect(stored.cursorStyle).toBe('LINE')
  })

  it('resetSettings restores defaults', () => {
    function Reader() {
      const { settings, updateSetting, resetSettings } = useSettings()
      return (
        <>
          <span data-testid="theme">{settings.theme}</span>
          <button onClick={() => updateSetting('theme', 'ocean')}>change</button>
          <button onClick={resetSettings}>reset</button>
        </>
      )
    }

    render(
      <SettingsProvider>
        <Reader />
      </SettingsProvider>,
    )

    act(() => screen.getByText('change').click())
    expect(screen.getByTestId('theme')).toHaveTextContent('ocean')

    act(() => screen.getByText('reset').click())
    expect(screen.getByTestId('theme')).toHaveTextContent('catppuccin-mocha')
  })

  it('loads saved settings from localStorage on mount', () => {
    const saved: Partial<Settings> = { theme: 'timber', font: 'lora' }
    localStorage.setItem('narratype-settings', JSON.stringify(saved))

    function Reader() {
      const { settings } = useSettings()
      return (
        <>
          <span data-testid="theme">{settings.theme}</span>
          <span data-testid="font">{settings.font}</span>
        </>
      )
    }

    render(
      <SettingsProvider>
        <Reader />
      </SettingsProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('timber')
    expect(screen.getByTestId('font')).toHaveTextContent('lora')
  })

  it('throws when useSettings is used outside provider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BadReader() {
      useSettings()
      return <span>bad</span>
    }

    expect(() => render(<BadReader />)).toThrow('useSettings must be used within SettingsProvider')
    spy.mockRestore()
  })
})
