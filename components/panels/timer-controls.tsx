'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

type TimerControlsProps = {
  running: boolean
  onToggle: () => void
  onReset: () => void
  accent: string
  disabled?: boolean
}

export function TimerControls({
  running,
  onToggle,
  onReset,
  accent,
  disabled,
}: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="flex h-12 w-12 items-center justify-center rounded-full text-black shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: accent, boxShadow: `0 8px 24px ${accent}55` }}
        aria-label={running ? 'Pause' : 'Start'}
      >
        {running ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
        )}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/80 transition-colors duration-200 hover:bg-white/10"
        aria-label="Reset"
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    </div>
  )
}
