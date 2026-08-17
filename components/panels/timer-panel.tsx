'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatClock, TimerControls } from './timer-controls'

const DIGIT_SHADOW = '0 2px 24px rgba(0,0,0,0.45)'
const STORAGE_KEY_MINUTES = 'timer_last_minutes'
const PRESETS = [1, 5, 10, 15, 25, 30]

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
  const [minutes, setMinutes] = useState(5)
  const [remaining, setRemaining] = useState(5 * 60)
  const [running, setRunning] = useState(false)
  const [isAlarming, setIsAlarming] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY_MINUTES)
    if (saved) {
      const n = Number(saved)
      if (!isNaN(n) && n > 0) {
        setMinutes(n)
        setRemaining(n * 60)
      }
    }
  }, [])

  const saveMinutes = (m: number) => {
    setMinutes(m)
    setRemaining(m * 60)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MINUTES, String(m))
    }
  }

  const stopAlarmHandler = useCallback(() => {
    if (isAlarming) {
      onStopAlarm?.()
      setIsAlarming(false)
      return true
    }
    return false
  }, [isAlarming, onStopAlarm])

  const togglePlay = useCallback(() => {
    if (isAlarming) {
      onStopAlarm?.()
      setIsAlarming(false)
      setRunning(true)
    } else {
      setRunning((r) => !r)
    }
  }, [isAlarming, onStopAlarm])

  const reset = useCallback(() => {
    stopAlarmHandler()
    setRunning(false)
    setRemaining(minutes * 60)
  }, [minutes, stopAlarmHandler])

  useEffect(() => {
    const handleToggle = () => togglePlay()
    const handleReset = () => reset()

    window.addEventListener('robo-toggle-play-timer', handleToggle)
    window.addEventListener('robo-reset-timer', handleReset)

    return () => {
      window.removeEventListener('robo-toggle-play-timer', handleToggle)
      window.removeEventListener('robo-reset-timer', handleReset)
    }
  }, [togglePlay, reset])

  useEffect(() => {
    onCountdown?.(running ? formatClock(remaining) : null)
  }, [running, remaining, onCountdown])

  useEffect(() => () => onCountdown?.(null), [onCountdown])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false)
          setIsAlarming(true)
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

  const formattedTime = formatClock(remaining)
  const isLongTime = formattedTime.length > 5
  const totalSeconds = minutes * 60
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0

  if (running) {
    return (
      <button
        type="button"
        onKeyDown={(e) => {
          if (e.code === 'Space' || e.code === 'KeyR') e.preventDefault()
        }}
        onClick={(e) => {
          e.currentTarget.blur()
          togglePlay()
        }}
        className="flex flex-col items-center gap-2 outline-none cursor-pointer"
        aria-label={`Timer running. ${formattedTime} remaining. Tap to pause.`}
      >
        <span
          className={`font-bold tabular-nums tracking-tight transition-all duration-300 ${
            isLongTime ? 'text-5xl sm:text-6xl' : 'text-7xl sm:text-8xl'
          }`}
          style={{ ...digitStyle, textShadow: DIGIT_SHADOW }}
        >
          {formattedTime}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={(e) => {
              e.currentTarget.blur()
              stopAlarmHandler()
              saveMinutes(p)
            }}
            className="rounded-full px-3 py-1 text-xs font-semibold tracking-wider transition active:scale-95"
            style={{
              background: minutes === p ? `${accent}22` : 'rgba(255,255,255,0.08)',
              color: minutes === p ? accent : 'var(--muted-foreground)',
            }}
          >
            {p}m
          </button>
        ))}
      </div>

      <div className="relative flex items-center justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          <circle cx="90" cy="90" r="82" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle
            cx="90"
            cy="90"
            r="82"
            fill="none"
            stroke={accent}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 82}
            strokeDashoffset={2 * Math.PI * 82 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span
          className={`absolute font-bold tabular-nums tracking-tight transition-all duration-300 ${
            isLongTime ? 'text-3xl' : 'text-5xl'
          }`}
          style={{ ...digitStyle, textShadow: DIGIT_SHADOW }}
        >
          {formattedTime}
        </span>
      </div>

      <TimerControls
        running={running}
        onToggle={() => {
          if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
          togglePlay()
        }}
        onReset={() => {
          if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
          reset()
        }}
        accent={accent}
      />
    </div>
  )
}
