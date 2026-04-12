import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../pages/HomePage'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('HomePage', () => {
  it('renders the app header', () => {
    renderWithRouter(<HomePage />)

    expect(screen.getByText('Narratype')).toBeInTheDocument()
  })

  it('renders the hero text', () => {
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
})
