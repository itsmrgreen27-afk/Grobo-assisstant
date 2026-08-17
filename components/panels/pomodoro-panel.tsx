'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatClock, TimerControls } from './timer-controls'

const DIGIT_SHADOW = '0 2px 24px rgba(0,0,0,0.45)'
const STORAGE_KEY_WORK = 'pomodoro_work_minutes'
const STORAGE_KEY_BREAK = 'pomodoro_break_minutes'
const STORAGE_KEY_LONG_BREAK = 'pomodoro_long_break_minutes'
const STORAGE_KEY_INTERVAL = 'pomodoro_long_break_interval'
const STORAGE_KEY_AUTO_BREAK = 'pomodoro_auto_start_breaks'
const STORAGE_KEY_AUTO_FOCUS = 'pomodoro_auto_start_focus'
const STORAGE_KEY_ROUNDS = 'pomodoro_completed_rounds'

type Phase = 'work' | 'break' | 'longBreak'

export function PomodoroPanel({
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
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [longBreakMinutes, setLongBreakMinutes] = useState(15)
  const [longBreakInterval, setLongBreakInterval] = useState(4)
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [autoStartFocus, setAutoFocus] = useState(false)

  const [phase, setPhase] = useState<Phase>('work')
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [rounds, setRounds] = useState(0)
  const [isAlarming, setIsAlarming] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const syncSettings = useCallback(() => {
    if (typeof window === 'undefined') return

    const savedWork = localStorage.getItem(STORAGE_KEY_WORK)
    const savedBreak = localStorage.getItem(STORAGE_KEY_BREAK)
    const savedLongBreak = localStorage.getItem(STORAGE_KEY_LONG_BREAK)
    const savedInterval = localStorage.getItem(STORAGE_KEY_INTERVAL)
    const savedAutoBreak = localStorage.getItem(STORAGE_KEY_AUTO_BREAK)
    const savedAutoFocus = localStorage.getItem(STORAGE_KEY_AUTO_FOCUS)

    let w = savedWork ? Number(savedWork) || 25 : 25
    let b = savedBreak ? Number(savedBreak) || 5 : 5
    let lb = savedLongBreak ? Number(savedLongBreak) || 15 : 15
    let inter = savedInterval ? Number(savedInterval) || 4 : 4

    setWorkMinutes(w)
    setBreakMinutes(b)
    setLongBreakMinutes(lb)
    setLongBreakInterval(inter)
    setAutoStartBreaks(savedAutoBreak === 'true')
    setAutoFocus(savedAutoFocus === 'true')
  }, [])

  useEffect(() => {
    syncSettings()
    if (phase === 'work') setRemaining(workMinutes * 60)

    if (typeof window !== 'undefined') {
      const savedRounds = localStorage.getItem(STORAGE_KEY_ROUNDS)
      if (savedRounds) {
        const parsedRounds = Number(savedRounds)
        if (!isNaN(parsedRounds) && parsedRounds >= 0) {
          setRounds(parsedRounds)
        }
      }
    }

    const handleStorage = () => syncSettings()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('pomodoro-settings-updated', syncSettings)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('pomodoro-settings-updated', syncSettings)
    }
  }, [syncSettings])

  useEffect(() => {
    if (!running && !isAlarming) {
      if (phase === 'work') setRemaining(workMinutes * 60)
      else if (phase === 'break') setRemaining(breakMinutes * 60)
      else setRemaining(longBreakMinutes * 60)
    }
  }, [phase, workMinutes, breakMinutes, longBreakMinutes, isAlarming])

  const getCurrentTotalSeconds = () => {
    if (phase === 'work') return workMinutes * 60
    if (phase === 'break') return breakMinutes * 60
    return longBreakMinutes * 60
  }

  const total = getCurrentTotalSeconds()

  useEffect(() => {
    onCountdown?.(running ? formatClock(remaining) : null)
  }, [running, remaining, onCountdown])

  useEffect(() => () => onCountdown?.(null), [onCountdown])

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
    setPhase('work')
    setRemaining(workMinutes * 60)
  }, [stopAlarmHandler, workMinutes])

  // الاستماع للأحداث الخاصة باختصارات لوحة المفاتيح
  useEffect(() => {
    const handleToggle = () => togglePlay()
    const handleReset = () => reset()

    window.addEventListener('robo-toggle-play-pomodoro', handleToggle)
    window.addEventListener('robo-reset-pomodoro', handleReset)

    return () => {
      window.removeEventListener('robo-toggle-play-pomodoro', handleToggle)
      window.removeEventListener('robo-reset-pomodoro', handleReset)
    }
  }, [togglePlay, reset])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsAlarming(true)
          onAlarm?.()

          if (phase === 'work') {
            const nextRounds = rounds + 1
            setRounds(nextRounds)
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_ROUNDS, String(nextRounds))
            }

            const isLongBreakTime = nextRounds % longBreakInterval === 0
            const nextPhase: Phase = isLongBreakTime ? 'longBreak' : 'break'
            const nextTime = (isLongBreakTime ? longBreakMinutes : breakMinutes) * 60

            setPhase(nextPhase)
            setRunning(autoStartBreaks)
            return nextTime
          } else {
            setPhase('work')
            setRunning(autoStartFocus)
            return workMinutes * 60
          }
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [
    running,
    phase,
    rounds,
    onAlarm,
    workMinutes,
    breakMinutes,
    longBreakMinutes,
    longBreakInterval,
    autoStartBreaks,
    autoStartFocus,
  ])

  const handleResetRounds = () => {
    setRounds(0)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ROUNDS, '0')
    }
  }

  const formattedTime = formatClock(remaining)
  const isLongTime = formattedTime.length > 5

  const getPhaseLabel = () => {
    if (phase === 'work') return 'Focus'
    if (phase === 'break') return 'Break'
    return 'Long Break'
  }

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
        aria-label={`${getPhaseLabel()} time remaining ${formattedTime}. Tap to pause.`}
      >
        <span
          className="text-xs font-semibold uppercase tracking-[0.25em] transition-colors"
          style={{ color: phase === 'work' ? accent : 'var(--muted-foreground)' }}
        >
          {getPhaseLabel()}
        </span>
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

  const progress = 1 - remaining / total

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            background: phase === 'work' ? `${accent}22` : 'rgba(255,255,255,0.08)',
            color: phase === 'work' ? accent : 'var(--muted-foreground)',
          }}
        >
          {getPhaseLabel()}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur()
            handleResetRounds()
          }}
          className="text-xs font-medium text-muted-foreground transition hover:text-white"
          title="Click to reset completed rounds"
        >
          {rounds} completed
        </button>
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
