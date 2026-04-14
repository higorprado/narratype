import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { SettingsProvider } from '@/context/SettingsContext'
import { ProgressProvider } from '@/context/ProgressContext'

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SettingsProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </SettingsProvider>
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('renders Header on all routes', () => {
    renderApp('/')

    expect(screen.getByText('Narratype')).toBeInTheDocument()
  })

  it('renders Header on chapters route', () => {
    renderApp('/chapters/the-call-of-cthulhu')

    expect(screen.getByText('Narratype')).toBeInTheDocument()
  })

  it('renders HomePage at root path', () => {
    renderApp('/')

    expect(
      screen.getByText('Practice typing by retyping classic literature'),
    ).toBeInTheDocument()
  })

  it('renders ChaptersPage at /chapters/:bookSlug', () => {
    renderApp('/chapters/the-call-of-cthulhu')

    expect(
      screen.getByRole('heading', { level: 1, name: 'The Call of Cthulhu' }),
    ).toBeInTheDocument()
  })

  it('navigates to typing console route and renders it', () => {
    renderApp('/typing-console/the-call-of-cthulhu/0/0')

    // TypingConsolePage renders the book title in breadcrumb and Settings button
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Books')).toBeInTheDocument()
  })
})
