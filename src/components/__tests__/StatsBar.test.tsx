import { render, screen } from '@testing-library/react'
import StatsBar from '../../components/StatsBar'

describe('StatsBar', () => {
  it('renders WPM and ACC labels', () => {
    render(<StatsBar wpm={50} accuracy={95} isStarted={true} />)
    expect(screen.getByText('WPM')).toBeInTheDocument()
    expect(screen.getByText('ACC')).toBeInTheDocument()
  })

  it('displays numeric values when started', () => {
    render(<StatsBar wpm={42} accuracy={87} isStarted={true} />)
    expect(screen.getByTestId('stats-wpm')).toHaveTextContent('42')
    expect(screen.getByTestId('stats-acc')).toHaveTextContent('87')
  })

  it('shows dashes when not started', () => {
    render(<StatsBar wpm={0} accuracy={0} isStarted={false} />)
    expect(screen.getByTestId('stats-wpm')).toHaveTextContent('---')
    expect(screen.getByTestId('stats-acc')).toHaveTextContent('---')
  })

  it('rounds fractional values', () => {
    render(<StatsBar wpm={42.7} accuracy={87.3} isStarted={true} />)
    expect(screen.getByTestId('stats-wpm')).toHaveTextContent('43')
    expect(screen.getByTestId('stats-acc')).toHaveTextContent('87')
  })
})
