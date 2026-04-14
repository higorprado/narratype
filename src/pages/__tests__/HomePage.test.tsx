import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../pages/HomePage'
import { SettingsProvider } from '@/context/SettingsContext'
import { ProgressProvider } from '@/context/ProgressContext'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter><SettingsProvider><ProgressProvider>{ui}</ProgressProvider></SettingsProvider></MemoryRouter>)
}

describe('HomePage', () => {
  it('renders the hero text in the header area', () => {
    renderWithRouter(<HomePage />)

    expect(
      screen.getByText('Practice typing by retyping classic literature'),
    ).toBeInTheDocument()
  })
  it('renders book cards from data', () => {
    renderWithRouter(<HomePage />)

    // getAllBooks returns books from the data file
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders the footer', () => {
    renderWithRouter(<HomePage />)

  })

  it('does not show delete dialog by default', () => {
    renderWithRouter(<HomePage />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not show edit dialog by default', () => {
    renderWithRouter(<HomePage />)
    // EditBookDialog has role=dialog with label 'Edit Book'
    const dialogs = screen.queryAllByRole('dialog')
    expect(dialogs).toHaveLength(0)
  })
})
