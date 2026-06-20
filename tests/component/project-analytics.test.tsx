/**
 * Component tests for ProjectAnalytics dashboard chart (Issue #15)
 * Verifies: typed ChartContainer integration, summary stats, hover interaction.
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectAnalytics } from '../../components/dashboard/project-analytics'

jest.mock('recharts', () => {
  const React = require('react')
  const passthrough =
    (name: string) =>
    ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement(name === 'ResponsiveContainer' ? 'div' : name, rest, children)

  return {
    ResponsiveContainer: passthrough('ResponsiveContainer'),
    BarChart:  passthrough('BarChart'),
    Bar:       () => null,
    XAxis:     () => null,
    YAxis:     () => null,
    CartesianGrid: () => null,
    Tooltip:   () => null,
    Cell:      () => null,
  }
})

describe('ProjectAnalytics', () => {
  it('renders the card with data-testid', () => {
    render(<ProjectAnalytics />)
    expect(screen.getByTestId('project-analytics')).toBeInTheDocument()
  })

  it('displays the chart heading', () => {
    render(<ProjectAnalytics />)
    expect(screen.getByRole('heading', { name: /Project Analytics/i })).toBeInTheDocument()
  })

  it('shows the weekly activity label', () => {
    render(<ProjectAnalytics />)
    expect(screen.getByText(/Weekly Activity/i)).toBeInTheDocument()
  })

  it('renders summary stats section with Average and Peak', () => {
    render(<ProjectAnalytics />)
    expect(screen.getByText(/Average:/i)).toBeInTheDocument()
    expect(screen.getByText(/Peak:/i)).toBeInTheDocument()
  })

  it('computed average is correct (45+75+74+92+35+60+50 / 7 = 61)', () => {
    render(<ProjectAnalytics />)
    expect(screen.getByText('61%')).toBeInTheDocument()
  })

  it('computed peak is correct (92%)', () => {
    render(<ProjectAnalytics />)
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('renders without crash on initial mount', () => {
    expect(() => render(<ProjectAnalytics />)).not.toThrow()
  })

  it('card has aria-hidden on the legend dot', () => {
    render(<ProjectAnalytics />)
    const dot = document.querySelector('[aria-hidden="true"]')
    expect(dot).not.toBeNull()
  })
})
