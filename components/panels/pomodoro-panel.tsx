'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatClock, TimerControls } from './timer-controls'

const DIGIT_SHADOW = '0 2px 24px rgba(0,0,0,0.45)'
const STORAGE_KEY_WORK = 'pomodoro_work_minutes'
const STORAGE_KEY_BREAK = 'pomodoro_break_minutes'
const STORAGE_KEY_ROUNDS = 'pomodoro_completed_rounds'

type Phase = 'work' | 'break'

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

  const [phase, setPhase] = useState<Phase>('work')
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [rounds, setRounds] = useState(0)
  const [isAlarming, setIsAlarming] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const savedWork = localStorage.getItem(STORAGE_KEY_WORK)
    const savedBreak = localStorage.getItem(STORAGE_KEY_BREAK)
    const savedRounds = localStorage.getItem(STORAGE_KEY_ROUNDS)

    if (savedWork) {
      const parsedWork = Number(savedWork)
      if (!isNaN(parsedWork) && parsedWork > 0) {
        setWorkMinutes(parsedWork)
        setRemaining(parsedWork * 60)
      }
    }

    if (savedBreak) {
      const parsedBreak = Number(savedBreak)
      if (!isNaN(parsedBreak) && parsedBreak > 0) {
        setBreakMinutes(parsedBreak)
      }
    }

    if (savedRounds) {
      const parsedRounds = Number(savedRounds)
      if (!isNaN(parsedRounds) && parsedRounds >= 0) {
        setRounds(parsedRounds)
      }
    }
  }, [])

  const workSeconds = workMinutes * 60
  const breakSeconds = breakMinutes * 60
  const total = phase === 'work' ? workSeconds : breakSeconds

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

  useEffect(() => {
    const handler = () => togglePlay()
    window.addEventListener('robo-toggle-play-pomodoro', handler)
    return () => window.removeEventListener('robo-toggle-play-pomodoro', handler)
  }, [togglePlay])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsAlarming(true)
          onAlarm?.()
          
          setRunning(false)

          if (phase === 'work') {
            setRounds((prevRounds) => {
              const newRounds = prevRounds + 1
              localStorage.setItem(STORAGE_KEY_ROUNDS, String(newRounds))
              return newRounds
            })
            setPhase('break')
            return breakSeconds
          } else {
            setPhase('work')
            return workSeconds
          }
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, phase, onAlarm, workSeconds, breakSeconds])

  const reset = useCallback(() => {
    stopAlarmHandler()
    setRunning(false)
    setPhase('work')
    setRemaining(workMinutes * 60)
  }, [stopAlarmHandler, workMinutes])

  const handleWorkMinutesChange = (val: number) => {
    const mins = Math.min(180, Math.max(1, val || 1))
    setWorkMinutes(mins)
    localStorage.setItem(STORAGE_KEY_WORK, String(mins))
    if (phase === 'work' && !running && !isAlarming) {
      setRemaining(mins * 60)
    }
  }

  const handleBreakMinutesChange = (val: number) => {
    const mins = Math.min(60, Math.max(1, val || 1))
    setBreakMinutes(mins)
    localStorage.setItem(STORAGE_KEY_BREAK, String(mins))
    if (phase === 'break' && !running && !isAlarming) {
      setRemaining(mins * 60)
    }
  }

  const handleResetRounds = () => {
    setRounds(0)
    localStorage.setItem(STORAGE_KEY_ROUNDS, '0')
  }

  const formattedTime = formatClock(remaining)
  const isLongTime = formattedTime.length > 5

  // Minimal view when running
  if (running) {
    return (
      <button
        type="button"
        onClick={() => setRunning(false)}
        className="flex flex-col items-center gap-2 outline-none"
        aria-label={`${phase === 'work' ? 'Focus' : 'Break'} time remaining ${formattedTime}. Tap to pause.`}
      >
        <span
          className="text-xs font-semibold uppercase tracking-[0.25em] transition-colors"
          style={{ color: phase === 'work' ? accent : 'var(--muted-foreground)' }}
        >
          {phase === 'work' ? 'Focus' : 'Break'}
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
          {phase === 'work' ? 'Focus' : 'Break'}
        </span>
        <button
          type="button"
          onClick={handleResetRounds}
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
        onToggle={togglePlay}
        onReset={reset}
        accent={accent}
      />

      <div className="mt-2 flex items-center gap-4 rounded-xl bg-white/5 p-3 text-xs text-muted-foreground backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span>Focus (m):</span>
          <input
            type="number"
            min="1"
            max="180"
            value={workMinutes}
            onChange={(e) => handleWorkMinutesChange(Number(e.target.value))}
            className="w-12 rounded bg-black/30 p-1 text-center font-bold text-white outline-none focus:ring-1"
            style={{ focusRingColor: accent }}
          />
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex items-center gap-2">
          <span>Break (m):</span>
          <input
            type="number"
            min="1"
            max="60"
            value={breakMinutes}
            onChange={(e) => handleBreakMinutesChange(Number(e.target.value))}
            className="w-12 rounded bg-black/30 p-1 text-center font-bold text-white outline-none focus:ring-1"
            style={{ focusRingColor: accent }}
          />
        </div>
      </div>
    </div>
  )
}
