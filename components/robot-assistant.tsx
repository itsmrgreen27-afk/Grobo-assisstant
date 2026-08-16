'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BackgroundThemes } from '@/components/background-themes'
import { BottomNav, type Mode } from '@/components/bottom-nav'
import { ClockPanel } from '@/components/panels/clock-panel'
import { PomodoroPanel } from '@/components/panels/pomodoro-panel'
import { TimerPanel } from '@/components/panels/timer-panel'
import { PwaInstallButton } from '@/components/pwa-install-button'
import { RobotFace } from '@/components/robot-face'
import { SettingsPanel } from '@/components/settings-panel'
import { TodoDrawer } from '@/components/todo-drawer'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useRobotEyes } from '@/hooks/use-robot-eyes'
import { useRobotSettings } from '@/hooks/use-robot-settings'
import { getDigitStyle } from '@/lib/digit-style'
import {
  isMuted,
  primeAudio,
  startAlarm,
  stopAlarm,
  toggleMute,
} from '@/lib/audio'

function isLightColor(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length < 6) return false
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.6
}

const MODES: Mode[] = ['robot', 'pomodoro', 'timer', 'clock']

const MODE_TITLES: Record<Exclude<Mode, 'robot'>, string> = {
  pomodoro: 'Pomodoro',
  timer: 'Timer',
  clock: 'Clock',
}

const BASE_TITLE = 'Grobo'

export function RobotAssistant() {
  const { settings, updateSetting } = useRobotSettings()
  const { blink, asleep, gaze } = useRobotEyes({
    lookAround: settings.lookAround,
    winking: settings.winking,
    idleSleep: settings.idleSleep,
  })
  const [mode, setMode] = useState<Mode>('robot')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [todoOpen, setTodoOpen] = useState(false)
  const [alarmActive, setAlarmActive] = useState(false)
  const [zen, setZen] = useState(false)
  const [showExitZenBtn, setShowExitZenBtn] = useState(true)
  const [muted, setMutedState] = useState(false)

  const [pomoCountdown, setPomoCountdown] = useState<string | null>(null)
  const [timerCountdown, setTimerCountdown] = useState<string | null>(null)

  const [hint, setHint] = useState<string | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const zenTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const light = isLightColor(settings.backgroundColor)
  const hasWidget = mode !== 'robot'
  const digitStyle = getDigitStyle(settings)

  const flashHint = useCallback((message: string) => {
    setHint(message)
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(null), 1600)
  }, [])

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current)
    if (zenTimer.current) clearTimeout(zenTimer.current)
  }, [])

  useEffect(() => {
    let currentCountdown: string | null = null
    if (mode === 'pomodoro') currentCountdown = pomoCountdown
    if (mode === 'timer') currentCountdown = timerCountdown

    document.title = currentCountdown ? `(${currentCountdown}) Grobo` : BASE_TITLE
    return () => {
      document.title = BASE_TITLE
    }
  }, [mode, pomoCountdown, timerCountdown])

  const onAlarm = useCallback(() => {
    startAlarm(settings.alarmSound)
    setTimeout(() => {
      setAlarmActive(true)
    }, 0)
  }, [settings.alarmSound])

  const onStopAlarm = useCallback(() => {
    stopAlarm()
    setAlarmActive(false)
  }, [])

  const changeMode = useCallback(
    (next: Mode) => {
      onStopAlarm()
      setMode(next)
    },
    [onStopAlarm],
  )

  const handleNextMode = useCallback(() => {
    setMode((prev) => {
      const idx = MODES.indexOf(prev)
      const nextIdx = (idx + 1) % MODES.length
      onStopAlarm()
      return MODES[nextIdx]
    })
  }, [onStopAlarm])

  const handlePrevMode = useCallback(() => {
    setMode((prev) => {
      const idx = MODES.indexOf(prev)
      const prevIdx = (idx - 1 + MODES.length) % MODES.length
      onStopAlarm()
      return MODES[prevIdx]
    })
  }, [onStopAlarm])

  const handleTogglePlay = useCallback(() => {
    onStopAlarm()
    if (mode === 'timer') {
      window.dispatchEvent(new CustomEvent('robo-toggle-play-timer'))
    } else if (mode === 'pomodoro') {
      window.dispatchEvent(new CustomEvent('robo-toggle-play-pomodoro'))
    }
  }, [mode, onStopAlarm])

  const handleToggleMute = useCallback(() => {
    const next = toggleMute()
    setMutedState(next)
    flashHint(next ? 'Muted' : 'Unmuted')
  }, [flashHint])

  const handleToggleZen = useCallback(() => {
    setZen((z) => {
      const next = !z
      if (next) {
        setSettingsOpen(false)
        setTodoOpen(false)
        flashHint('Zen mode — tap anywhere or press Esc to exit')
      }
      return next
    })
  }, [flashHint])

  const handleExitZen = useCallback(() => {
    setZen((z) => {
      if (z) flashHint('Exited zen mode')
      return false
    })
  }, [flashHint])

  const handleMouseMove = useCallback(() => {
    if (!zen) return
    setShowExitZenBtn(true)
    if (zenTimer.current) clearTimeout(zenTimer.current)
    zenTimer.current = setTimeout(() => {
      setShowExitZenBtn(false)
    }, 3000)
  }, [zen])

  useKeyboardShortcuts({
    onTogglePlay: handleTogglePlay,
    onToggleMute: handleToggleMute,
    onToggleZen: handleToggleZen,
    onExitZen: handleExitZen,
    onNextMode: handleNextMode,
    onPrevMode: handlePrevMode,
  })

  useEffect(() => {
    setMutedState(isMuted())
  }, [])

  const themeVars = light
    ? ({
        '--foreground': '#111015',
        '--muted-foreground': 'rgba(17,16,21,0.6)',
      } as React.CSSProperties)
    : ({
        '--foreground': '#f4f4f6',
        '--muted-foreground': 'rgba(244,244,246,0.62)',
      } as React.CSSProperties)

  return (
    <main
      onPointerDown={primeAudio}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-svh flex-col items-center justify-between pb-24 pt-8 px-4 overflow-hidden transition-colors duration-500"
      style={{
        background: settings.backgroundColor,
        color: 'var(--foreground)',
        ...themeVars,
      }}
    >
      <BackgroundThemes
        effect={settings.backgroundEffect}
        color={settings.eyeColor}
        light={light}
      />

      {/* زر دخول وضع Zen مخصص للجوّال في أعلى اليسار */}
      {!zen && (
        <button
          type="button"
          onClick={handleToggleZen}
          aria-label="Enter Zen Mode"
          className="fixed left-4 top-4 z-30 flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2.5 text-foreground/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-foreground active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}

      {!zen && <PwaInstallButton accent={settings.eyeColor} />}

      <div className="relative z-10 flex w-full max-w-md flex-col items-center my-auto gap-2">
        <div className="flex w-full justify-center">
          <RobotFace
            eyeColor={settings.eyeColor}
            eyeStyle={settings.eyeStyle}
            eyeScale={settings.eyeScale}
            eyeRoundness={settings.eyeRoundness}
            blink={blink}
            asleep={asleep}
            gaze={gaze}
            alarm={alarmActive}
            compact={hasWidget && !zen}
          />
        </div>

        {hasWidget && (
          <section
            aria-label={MODE_TITLES[mode as Exclude<Mode, 'robot'>]}
            className="animate-robo-fade-up -mt-2 flex w-full flex-col items-center justify-center"
          >
            <div className={mode === 'clock' ? 'flex w-full justify-center' : 'hidden'}>
              <ClockPanel digitStyle={digitStyle} />
            </div>

            <div className={mode === 'pomodoro' ? 'flex w-full justify-center' : 'hidden'}>
              <PomodoroPanel
                accent={settings.eyeColor}
                digitStyle={digitStyle}
                onAlarm={onAlarm}
                onStopAlarm={onStopAlarm}
                onCountdown={setPomoCountdown}
              />
            </div>

            <div className={mode === 'timer' ? 'flex w-full justify-center' : 'hidden'}>
              <TimerPanel
                accent={settings.eyeColor}
                digitStyle={digitStyle}
                onAlarm={onAlarm}
                onStopAlarm={onStopAlarm}
                onCountdown={setTimerCountdown}
              />
            </div>
          </section>
        )}
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 top-6 z-40 -translate-x-1/2 transition-opacity duration-300"
        style={{ opacity: hint ? 1 : 0 }}
      >
        {hint && (
          <span className="rounded-full border border-white/10 bg-neutral-950/80 px-4 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-xl">
            {hint}
          </span>
        )}
      </div>

      {!zen && (
        <BottomNav
          mode={mode}
          onModeChange={changeMode}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenTodo={() => setTodoOpen(true)}
          accent={settings.eyeColor}
        />
      )}

      {zen && (
        <button
          type="button"
          onClick={handleExitZen}
          className={`fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-xl transition-opacity duration-500 hover:bg-white/10 hover:text-white ${
            showExitZenBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          Exit Zen
        </button>
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        updateSetting={updateSetting}
      />

      <TodoDrawer
        open={todoOpen}
        onClose={() => setTodoOpen(false)}
        accent={settings.eyeColor}
      />
    </main>
  )
}
