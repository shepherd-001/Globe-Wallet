/**
 * Unit tests for formatRelativeDate — issue #29
 * Covers edge cases, boundary conditions, and invalid inputs.
 */
import { formatRelativeDate } from '../../../lib/helpers/format'

describe('formatRelativeDate', () => {
  const now = new Date('2026-06-18T12:00:00Z')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns "Just now" for times within 60 seconds', () => {
    expect(formatRelativeDate(new Date('2026-06-18T11:59:30Z'))).toBe('Just now')
    expect(formatRelativeDate(new Date('2026-06-18T12:00:00Z'))).toBe('Just now')
  })

  it('returns minutes ago for times within the hour', () => {
    expect(formatRelativeDate(new Date('2026-06-18T11:55:00Z'))).toBe('5 minutes ago')
    expect(formatRelativeDate(new Date('2026-06-18T11:59:00Z'))).toBe('1 minute ago')
  })

  it('returns hours ago for times within the same day', () => {
    expect(formatRelativeDate(new Date('2026-06-18T09:00:00Z'))).toBe('3 hours ago')
    expect(formatRelativeDate(new Date('2026-06-18T11:00:00Z'))).toBe('1 hour ago')
  })

  it('returns "Yesterday" for dates exactly 1 day ago', () => {
    expect(formatRelativeDate(new Date('2026-06-17T12:00:00Z'))).toBe('Yesterday')
  })

  it('returns days ago for dates within the last week', () => {
    expect(formatRelativeDate(new Date('2026-06-15T12:00:00Z'))).toBe('3 days ago')
  })

  it('returns formatted month/day for dates older than a week', () => {
    const result = formatRelativeDate(new Date('2026-06-01T12:00:00Z'))
    expect(result).toMatch(/Jun/)
  })

  it('handles ISO string input', () => {
    const result = formatRelativeDate('2026-06-18T11:59:00Z')
    expect(result).toBe('1 minute ago')
  })

  it('handles numeric timestamp input', () => {
    const ts = new Date('2026-06-18T11:55:00Z').getTime()
    expect(formatRelativeDate(ts)).toBe('5 minutes ago')
  })

  it('returns the original value for invalid date strings', () => {
    const result = formatRelativeDate('not-a-date')
    expect(result).toBe('not-a-date')
  })

  it('handles empty string gracefully', () => {
    const result = formatRelativeDate('')
    expect(typeof result).toBe('string')
  })
})
