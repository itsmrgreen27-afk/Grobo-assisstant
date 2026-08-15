'use client'

import { Minus, Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatClock, TimerControls } from './timer-controls'

const PRESETS = [1, 5, 10, 25]

// High-contrast glow so floating digits read cleanly over the background.
const DIGIT_SHADOW = '0 2px 24px rgba(0,0,0,0.45)'

export function TimerPanel({
  accent,
  digitStyle,
  onAlarm,
  onStopAlarm,
  onCountdown,
}: {
  accent: string
  digitStyle?: CSSProperties
  onAlarm?: () => void
  onStopAlarm?: () => void
  onCountdown?: (label: string | null) => void
}) {
  const [duration, setDuration] = useState(5 * 60)
  const [remaining, setRemaining] = useState(5 * 60)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Report the countdown to the parent for tab-title sync.
  useEffect(() => {
    onCountdown?.(running ? formatClock(remaining) : null)
  }, [running, remaining, onCountdown])

  useEffect(() => () => onCountdown?.(null), [onCountdown])

  const togglePlay = useCallback(() => {
    if (remaining === 0) return
    onStopAlarm?.()
    setDone(false)
    setRunning((r) => !r)
  }, [remaining, onStopAlarm])

  // الاستماع للحدث الخاص بالعداد (Timer) فقط
  useEffect(() => {
    const handler = () => togglePlay()
    window.addEventListener('robo-toggle-play-timer', handler)
    return () => window.removeEventListener('robo-toggle-play-timer', handler)
  }, [togglePlay])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false)
          setDone(true)
          onAlarm?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, onAlarm])

  const setMinutes = useCallback(
    (mins: number) => {
      const secs = Math.max(60, Math.min(99 * 60, mins * 60))
      onStopAlarm?.()
      setRunning(false)
      setDone(false)
      setDuration(secs)
      setRemaining(secs)
    },
    [onStopAlarm],
  )

  const adjust = useCallback(
    (deltaMin: number) => {
      if (running) return
      setMinutes(Math.round(duration / 60) + deltaMin)
    },
    [duration, running, setMinutes],
  )

  const reset = useCallback(() => {
    onStopAlarm?.()
    setRunning(false)
    setDone(false)
    setRemaining(duration)
  }, [duration, onStopAlarm])

  const idle = !running && remaining === duration

  if (running) {
    return (
      <button
        type="button"
        onClick={() => setRunning(false)}
        className="outline-none"
        aria-label={`Time remaining ${formatClock(remaining)}. Tap to pause.`}
      >
        <span
          className="text-7xl font-bold tabular-nums tracking-tight sm:text-8xl"
          style={{ ...digitStyle, textShadow: DIGIT_SHADOW }}
        >
          {formatClock(remaining)}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESETS.map((m) => {
          const active = duration === m * 60
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(m)}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200"
              style={{
                background: active ? `${accent}22` : 'transparent',
                color: active ? accent : 'var(--muted-foreground)',
              }}
            >
              {m}m
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={running}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:text-foreground disabled:opacity-30"
          aria-label="Decrease one minute"
        >
          <Minus className="h-5 w-5" />
        </button>
        <span
          className="text-6xl font-bold tabular-nums tracking-tight transition-colors sm:text-7xl"
          style={{
            ...digitStyle,
            color: done ? accent : (digitStyle?.color ?? 'var(--foreground)'),
            textShadow: DIGIT_SHADOW,
          }}
        >
          {formatClock(remaining)}
        </span>
        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={running}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:text-foreground disabled:opacity-30"
          aria-label="Increase one minute"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="h-4 text-xs font-medium text-muted-foreground">
        {done ? "Time's up!" : idle ? 'Ready' : 'Paused'}
      </div>

      <TimerControls
        running={running}
        onToggle={togglePlay}
        onReset={reset}
        accent={accent}
        disabled={remaining === 0 && !running}
      />
    </div>
  )
}