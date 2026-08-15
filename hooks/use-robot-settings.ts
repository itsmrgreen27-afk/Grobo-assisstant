'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AlarmSound } from '@/lib/audio'

export type FontStyle = 'mono' | 'sans' | 'pixel' | 'silkscreen' | 'orbitron' | 'vt323'
export type EyeStyle = 'default' | 'capsule' | 'anime' | 'neon'
export type BackgroundEffect = 'rain' | 'snow' | 'clouds' | 'grid' | 'solid'

export type RobotSettings = {
  eyeColor: string
  backgroundColor: string
  backgroundEffect: BackgroundEffect
  // Eye shape & size
  eyeStyle: EyeStyle
  eyeScale: number
  eyeRoundness: number
  // Digits / text
  fontStyle: FontStyle
  textColor: string // '' = auto (follows background contrast)
  textOpacity: number
  // Audio
  alarmSound: AlarmSound
  // Animation toggles
  lookAround: boolean
  winking: boolean
  idleSleep: boolean
}

export const EYE_COLOR_PRESETS = [
  { name: 'Cyan', value: '#38e1d6' },
  { name: 'Sky', value: '#4cc9f0' },
  { name: 'Violet', value: '#a78bfa' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Lime', value: '#a3e635' },
  { name: 'Amber', value: '#fbbf24' },
]

export const BACKGROUND_PRESETS = [
  { name: 'Midnight', value: '#0d1117' },
  { name: 'Ink', value: '#111015' },
  { name: 'Deep Sea', value: '#0b1f2a' },
  { name: 'Plum', value: '#1a1024' },
  { name: 'Slate', value: '#1e293b' },
  { name: 'Pastel Mist', value: '#e9e6f2' },
]

export const EYE_STYLES: { name: string; value: EyeStyle }[] = [
  { name: 'Default', value: 'default' },
  { name: 'Capsule', value: 'capsule' },
  { name: 'Anime Slit', value: 'anime' },
  { name: 'Neon Dash', value: 'neon' },
]

export const FONT_STYLES: { name: string; value: FontStyle }[] = [
  { name: 'Monospace', value: 'mono' },
  { name: 'Clean Sans', value: 'sans' },
  { name: 'Pixel Retro', value: 'pixel' },
  { name: 'Silkscreen', value: 'silkscreen' },
  { name: 'Orbitron', value: 'orbitron' },
  { name: 'VT323', value: 'vt323' },
]

export const BACKGROUND_EFFECTS: { name: string; value: BackgroundEffect }[] = [
  { name: 'Rainy Night', value: 'rain' },
  { name: 'Falling Snow', value: 'snow' },
  { name: 'Drifting Clouds', value: 'clouds' },
  { name: 'Cyber Grid', value: 'grid' },
  { name: 'Minimal Solid', value: 'solid' },
]

const STORAGE_KEY = 'robo-assistant-settings'

const DEFAULT_SETTINGS: RobotSettings = {
  eyeColor: '#38e1d6',
  backgroundColor: '#0d1117',
  backgroundEffect: 'grid',
  eyeStyle: 'default',
  eyeScale: 1,
  eyeRoundness: 38,
  fontStyle: 'mono',
  textColor: '',
  textOpacity: 1,
  alarmSound: 'beep',
  lookAround: true,
  winking: true,
  idleSleep: true,
}

export function useRobotSettings() {
  const [settings, setSettings] = useState<RobotSettings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  // Load persisted settings after mount to avoid hydration mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<RobotSettings>
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // Ignore malformed storage.
    }
    setHydrated(true)
  }, [])

  // Persist whenever settings change (after initial hydration).
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore storage write failures (e.g. private mode).
    }
  }, [settings, hydrated])

  const updateSetting = useCallback(
    <K extends keyof RobotSettings>(key: K, value: RobotSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  return { settings, updateSetting, hydrated }
}