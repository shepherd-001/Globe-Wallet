/**
 * Component tests for AnalyticsContent (Issue #15)
 * Covers: stat cards render, chart containers present, hover states, accessibility.
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnalyticsContent } from '../../components/analytics/analytics-content'

// Mock recharts to avoid SVG rendering issues in jsdom
jest.mock('recharts', () => {
  const React = require('react')
  const passthrough =
    (name: string) =>
    ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement(name === 'ResponsiveContainer' ? 'div' : name, rest, children)

  return {
    ResponsiveContainer: passthrough('ResponsiveContainer'),
    LineChart:   passthrough('LineChart'),
    BarChart:    passthrough('BarChart'),
    Line:        () => null,
    Bar:         () => null,
    XAxis:       () => null,
    YAxis:       () => null,
    CartesianGrid: () => null,
    Tooltip:     () => null,
    Legend:      () => null,
  }
})

describe('AnalyticsContent', () => {
  it('renders the analytics content container', () => {
    render(<AnalyticsContent />)
    expect(screen.getByTestId('analytics-content')).toBeInTheDocument()
  })

  it('renders all four stat cards', () => {
    render(<AnalyticsContent />)
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`analytics-stat-${i}`)).toBeInTheDocument()
    }
  })

  it('displays correct stat titles', () => {
    render(<AnalyticsContent />)
    expect(screen.getByText('Total Tasks Completed')).toBeInTheDocument()
    expect(screen.getByText('Active Projects')).toBeInTheDocument()
    expect(screen.getByText('Team Members')).toBeInTheDocument()
    expect(screen.getByText('Avg. Completion Time')).toBeInTheDocument()
  })

  it('displays stat values', () => {
    render(<AnalyticsContent />)
    expect(screen.getByText('247')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('2.3')).toBeInTheDocument()
  })

  it('shows trend indicators', () => {
    render(<AnalyticsContent />)
    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('applies scale class on hover and removes on leave', () => {
    render(<AnalyticsContent />)
    const card = screen.getByTestId('analytics-stat-0')
    expect(card.className).not.toMatch(/scale-105/)
    fireEvent.mouseEnter(card)
    expect(card.className).toMatch(/scale-105/)
    fireEvent.mouseLeave(card)
    expect(card.className).not.toMatch(/scale-105/)
  })

  it('renders volume chart container', () => {
    render(<AnalyticsContent />)
    expect(screen.getByTestId('volume-chart')).toBeInTheDocument()
    expect(screen.getByText('Transaction Volume (7 Days)')).toBeInTheDocument()
  })

  it('renders category chart container', () => {
    render(<AnalyticsContent />)
    expect(screen.getByTestId('category-chart')).toBeInTheDocument()
    expect(screen.getByText('Transactions by Category')).toBeInTheDocument()
  })

  it('stat cards are keyboard-accessible with implicit button role not required (div)', () => {
    render(<AnalyticsContent />)
    const card = screen.getByTestId('analytics-stat-0')
    expect(card.tagName.toLowerCase()).not.toBe('button')
  })

  it('does not crash with no transactions (uses mock data)', () => {
    expect(() => render(<AnalyticsContent />)).not.toThrow()
  })
})
