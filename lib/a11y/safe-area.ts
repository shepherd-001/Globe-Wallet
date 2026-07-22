import type { SafeAreaInsets } from '../types'

export type SafeAreaSide = 'top' | 'bottom' | 'left' | 'right'

/**
 * Returns a CSS `env()` expression for a single safe-area inset side.
 * Falls back to `fallback` when the browser does not support the env() function
 * or the device reports no inset (e.g. desktop browsers).
 */
export function safeAreaInset(side: SafeAreaSide, fallback = '0px'): string {
  return `env(safe-area-inset-${side}, ${fallback})`
}

/**
 * Bottom padding for the BottomNav ul — keeps items above the iOS home indicator.
 * 0.5rem base py-2 + safe-area bottom.
 */
export const SAFE_AREA_BOTTOM_NAV_PB = 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' as const

/**
 * Bottom padding for AppShell <main> — ensures content never hides behind the
 * bottom nav + home indicator.  6rem ≈ pb-24 (96 px).
 */
export const SAFE_AREA_MAIN_PB = 'calc(6rem + env(safe-area-inset-bottom, 0px))' as const

/**
 * Top padding for sticky elements that must clear the status bar on
 * notched devices.
 */
export const SAFE_AREA_STATUS_BAR_PT = 'env(safe-area-inset-top, 0px)' as const

/** Returns all four inset env() strings in a typed object. */
export function getSafeAreaInsetValues(): SafeAreaInsets {
  return {
    top: safeAreaInset('top'),
    bottom: safeAreaInset('bottom'),
    left: safeAreaInset('left'),
    right: safeAreaInset('right'),
  }
}

/** Builds a complete padding shorthand covering all four insets. */
export function safeAreaPadding(extra = '0px'): string {
  return [
    `calc(${safeAreaInset('top')} + ${extra})`,
    `calc(${safeAreaInset('right')} + ${extra})`,
    `calc(${safeAreaInset('bottom')} + ${extra})`,
    `calc(${safeAreaInset('left')} + ${extra})`,
  ].join(' ')
}
