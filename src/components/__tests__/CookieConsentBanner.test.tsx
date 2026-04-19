import { render, screen, fireEvent } from '@testing-library/react'
import CookieConsentBanner from '../CookieConsentBanner'

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders all three buttons when no consent stored', () => {
    render(<CookieConsentBanner />)

    expect(screen.getByRole('button', { name: 'Accept All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Non-Personalized Only' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject All' })).toBeInTheDocument()
  })

  it('does not render when consent already decided', () => {
    localStorage.setItem('narratype-consent', JSON.stringify({ ad_storage: 'denied' }))

    render(<CookieConsentBanner />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking "Accept All" stores correct consent and hides banner', () => {
    render(<CookieConsentBanner />)

    fireEvent.click(screen.getByRole('button', { name: 'Accept All' }))

    const stored = JSON.parse(localStorage.getItem('narratype-consent')!)
    expect(stored).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking "Non-Personalized Only" stores correct consent', () => {
    render(<CookieConsentBanner />)

    fireEvent.click(screen.getByRole('button', { name: 'Non-Personalized Only' }))

    const stored = JSON.parse(localStorage.getItem('narratype-consent')!)
    expect(stored).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })
  })

  it('clicking "Reject All" stores correct consent', () => {
    render(<CookieConsentBanner />)

    fireEvent.click(screen.getByRole('button', { name: 'Reject All' }))

    const stored = JSON.parse(localStorage.getItem('narratype-consent')!)
    expect(stored).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })
  })
})
