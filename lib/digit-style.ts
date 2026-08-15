import type { CSSProperties } from 'react'
import type { FontStyle, RobotSettings } from '@/hooks/use-robot-settings'

export function digitFontFamily(style: FontStyle): string {
  switch (style) {
    case 'sans':
      return 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif'
    case 'pixel':
      return 'var(--font-pixel), var(--font-geist-mono), monospace'
    default:
      return 'var(--font-geist-mono), ui-monospace, monospace'
  }
}

/** Builds the shared inline style for the floating time digits. */
export function getDigitStyle(settings: RobotSettings): CSSProperties {
  return {
    fontFamily: digitFontFamily(settings.fontStyle),
    color: settings.textColor || 'var(--foreground)',
    opacity: settings.textOpacity,
    // Pixel font renders large; scale it down a touch for balance.
    fontSize: settings.fontStyle === 'pixel' ? '0.7em' : undefined,
    letterSpacing: settings.fontStyle === 'pixel' ? '0.02em' : undefined,
  }
}
