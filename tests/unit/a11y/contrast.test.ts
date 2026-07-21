/**
 * Unit tests — WCAG Relative Luminance & Contrast Utilities (Issue #87)
 */

import {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  isWCAGCompliant,
} from '../../../lib/a11y/contrast'

describe('a11y/contrast utilities', () => {
  it('correctly converts 3-digit and 6-digit hex strings to RGB', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0, a: 1 })
    expect(hexToRgb('#047857')).toEqual({ r: 4, g: 120, b: 87, a: 1 })
  })

  it('calculates relative luminance for black and white', () => {
    expect(getLuminance('#ffffff')).toBeCloseTo(1.0, 2)
    expect(getLuminance('#000000')).toBeCloseTo(0.0, 2)
  })

  it('calculates exact WCAG contrast ratios', () => {
    // White on black must be 21:1
    expect(getContrastRatio('#ffffff', '#000000')).toBe(21)
    // White on white must be 1:1
    expect(getContrastRatio('#ffffff', '#ffffff')).toBe(1)
    // emerald-800 (#065f46) on emerald-100 (#d1fae5)
    expect(getContrastRatio('#065f46', '#d1fae5')).toBeGreaterThanOrEqual(4.5)
  })

  it('validates WCAG 2.2 AA compliance thresholds', () => {
    // 4.5:1 ratio required for normal text
    expect(isWCAGCompliant('#047857', '#ffffff')).toBe(true) // 4.74:1
    expect(isWCAGCompliant('#22c55e', '#ffffff')).toBe(false) // 1.84:1
  })
})
