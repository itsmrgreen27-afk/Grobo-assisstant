'use client'

import { Check, ChevronDown, Volume2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  BACKGROUND_EFFECTS,
  BACKGROUND_PRESETS,
  EYE_COLOR_PRESETS,
  EYE_STYLES,
  type BackgroundEffect,
  type RobotSettings,
} from '@/hooks/use-robot-settings'
import { ALARM_SOUNDS, playClick, previewAlarm } from '@/lib/audio'

type SettingsPanelProps = {
  open: boolean
  onClose: () => void
  settings: RobotSettings
  updateSetting: <K extends keyof RobotSettings>(
    key: K,
    value: RobotSettings[K],
  ) => void
}

const STORAGE_KEY_WORK = 'pomodoro_work_minutes'
const STORAGE_KEY_BREAK = 'pomodoro_break_minutes'
const STORAGE_KEY_LONG_BREAK = 'pomodoro_long_break_minutes'
const STORAGE_KEY_INTERVAL = 'pomodoro_long_break_interval'
const STORAGE_KEY_AUTO_BREAK = 'pomodoro_auto_start_breaks'
const STORAGE_KEY_AUTO_FOCUS = 'pomodoro_auto_start_focus'

function MiniEye({ style, side }: { style: string; side: 'left' | 'right' }) {
  const color = '#38e1d6'
  const base: CSSProperties = { background: color }

  let cls = 'h-5 w-3.5 rounded-md'
  const extra: CSSProperties = {}
  if (style === 'capsule') cls = 'h-5 w-2.5 rounded-full'
  if (style === 'neon') {
    cls = 'h-1.5 w-4 rounded-full self-center'
    extra.boxShadow = `0 0 6px ${color}, 0 0 12px ${color}aa`
  }
  if (style === 'anime') {
    cls = 'h-4 w-3.5 rounded-sm'
    extra.clipPath =
      side === 'left'
        ? 'polygon(0% 25%, 100% 0%, 100% 100%, 0% 100%)'
        : 'polygon(0% 0%, 100% 25%, 100% 100%, 0% 100%)'
  }

  return <span aria-hidden="true" className={cls} style={{ ...base, ...extra }} />
}

function EyeStyleGrid({
  value,
  onChange,
}: {
  value: string
  onChange: (v: any) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-white">Eye Style</span>
      <div className="grid grid-cols-3 gap-2.5">
        {EYE_STYLES.map((s) => {
          const active = value === s.value
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                playClick()
                onChange(s.value)
              }}
              aria-pressed={active}
              className="flex flex-col items-center gap-2 rounded-xl border p-2.5 transition-colors duration-150"
              style={{
                borderColor: active
                  ? 'rgba(56,225,214,0.6)'
                  : 'rgba(255,255,255,0.1)',
                background: active
                  ? 'rgba(56,225,214,0.1)'
                  : 'rgba(255,255,255,0.03)',
              }}
            >
              <span className="flex h-8 items-center justify-center gap-1">
                <MiniEye style={s.value} side="left" />
                <MiniEye style={s.value} side="right" />
              </span>
              <span
                className="text-[11px] font-medium leading-tight text-white/70"
                style={active ? { color: '#7ff0e7' } : undefined}
              >
                {s.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ColorField({
  label,
  presets,
  value,
  onChange,
}: {
  label: string
  presets: { name: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="flex flex-wrap gap-2.5">
        {presets.map((preset) => {
          const active = value.toLowerCase() === preset.value.toLowerCase()
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-label={preset.name}
              aria-pressed={active}
              title={preset.name}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition-transform duration-150 hover:scale-110"
              style={{ background: preset.value }}
            >
              {active && (
                <Check
                  className="h-4 w-4 drop-shadow"
                  style={{ color: '#000', mixBlendMode: 'difference' }}
                />
              )}
            </button>
          )
        })}
      </div>
      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <span className="text-sm text-white/60">Custom Color</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase text-white/60">
            {value}
          </span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent p-0.5"
            aria-label={`${label} custom color`}
          />
        </span>
      </label>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="font-mono text-xs text-white/60">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10"
        style={{ accentColor: '#38e1d6' }}
      />
    </div>
  )
}

function DropdownField<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { name: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <label className="flex flex-col gap-2.5">
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            playClick()
            onChange(e.target.value as T)
          }}
          className="w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors hover:bg-white/10 focus-visible:border-[rgba(56,225,214,0.6)]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-neutral-900 text-white">
              {o.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
          aria-hidden="true"
        />
      </div>
    </label>
  )
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  updateSetting,
}: SettingsPanelProps) {
  const [workTime, setWorkTime] = useState(25)
  const [breakTime, setBreakTime] = useState(5)
  const [longBreakTime, setLongBreakTime] = useState(15)
  const [longBreakInterval, setLongBreakInterval] = useState(4)
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [autoStartFocus, setAutoStartFocus] = useState(false)

  useEffect(() => {
    const savedWork = localStorage.getItem(STORAGE_KEY_WORK)
    const savedBreak = localStorage.getItem(STORAGE_KEY_BREAK)
    const savedLongBreak = localStorage.getItem(STORAGE_KEY_LONG_BREAK)
    const savedInterval = localStorage.getItem(STORAGE_KEY_INTERVAL)
    const savedAutoBreak = localStorage.getItem(STORAGE_KEY_AUTO_BREAK)
    const savedAutoFocus = localStorage.getItem(STORAGE_KEY_AUTO_FOCUS)

    if (savedWork) setWorkTime(Number(savedWork) || 25)
    if (savedBreak) setBreakTime(Number(savedBreak) || 5)
    if (savedLongBreak) setLongBreakTime(Number(savedLongBreak) || 15)
    if (savedInterval) setLongBreakInterval(Number(savedInterval) || 4)
    if (savedAutoBreak) setAutoStartBreaks(savedAutoBreak === 'true')
    if (savedAutoFocus) setAutoFocus(savedAutoFocus === 'true')
  }, [open])

  const notifyUpdate = () => {
    window.dispatchEvent(new Event('pomodoro-settings-updated'))
  }

  const handleWorkChange = (val: number) => {
    const mins = Math.min(180, Math.max(1, val || 1))
    setWorkTime(mins)
    localStorage.setItem(STORAGE_KEY_WORK, String(mins))
    notifyUpdate()
  }

  const handleBreakChange = (val: number) => {
    const mins = Math.min(60, Math.max(1, val || 1))
    setBreakTime(mins)
    localStorage.setItem(STORAGE_KEY_BREAK, String(mins))
    notifyUpdate()
  }

  const handleLongBreakChange = (val: number) => {
    const mins = Math.min(180, Math.max(1, val || 1))
    setLongBreakTime(mins)
    localStorage.setItem(STORAGE_KEY_LONG_BREAK, String(mins))
    notifyUpdate()
  }

  const handleIntervalChange = (val: number) => {
    const interval = Math.min(12, Math.max(1, val || 1))
    setLongBreakInterval(interval)
    localStorage.setItem(STORAGE_KEY_INTERVAL, String(interval))
    notifyUpdate()
  }

  const handleAutoBreakToggle = (val: boolean) => {
    setAutoStartBreaks(val)
    localStorage.setItem(STORAGE_KEY_AUTO_BREAK, String(val))
    notifyUpdate()
  }

  const handleAutoFocusToggle = (val: boolean) => {
    setAutoStartFocus(val)
    localStorage.setItem(STORAGE_KEY_AUTO_FOCUS, String(val))
    notifyUpdate()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        aria-hidden={!open}
        inert={!open}
        className="fixed right-0 top-0 z-50 flex h-full w-[min(88vw,380px)] flex-col border-l border-white/10 bg-neutral-950/80 text-white shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-col gap-7 overflow-y-auto px-5 py-6">
          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#38e1d6]">
              Appearance & Character
            </h3>
            
            <EyeStyleGrid
              value={settings.eyeStyle}
              onChange={(v) => updateSetting('eyeStyle', v)}
            />

            <ColorField
              label="Eye Color"
              presets={EYE_COLOR_PRESETS}
              value={settings.eyeColor}
              onChange={(v) => updateSetting('eyeColor', v)}
            />
            <ColorField
              label="Background Color"
              presets={BACKGROUND_PRESETS}
              value={settings.backgroundColor}
              onChange={(v) => updateSetting('backgroundColor', v)}
            />

            <DropdownField<BackgroundEffect>
              label="Background Effect"
              options={BACKGROUND_EFFECTS}
              value={settings.backgroundEffect}
              onChange={(v) => updateSetting('backgroundEffect', v)}
            />

            <SliderField
              label="Eye Scale"
              value={settings.eyeScale}
              min={0.6}
              max={1.4}
              step={0.05}
              display={`${settings.eyeScale.toFixed(2)}x`}
              onChange={(v) => updateSetting('eyeScale', v)}
            />
            <SliderField
              label="Eye Roundness"
              value={settings.eyeRoundness}
              min={10}
              max={50}
              step={2}
              display={`${settings.eyeRoundness}%`}
              onChange={(v) => updateSetting('eyeRoundness', v)}
            />

            <SliderField
              label="Digit Opacity"
              value={settings.textOpacity}
              min={0.3}
              max={1}
              step={0.05}
              display={`${Math.round(settings.textOpacity * 100)}%`}
              onChange={(v) => updateSetting('textOpacity', v)}
            />
          </div>

          <div className="h-px w-full bg-white/10" />

          <div className="flex flex-col gap-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#38e1d6]">
              Timer & Sound Settings
            </h3>

            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
              <span className="text-sm font-medium text-white">Pomodoro Durations</span>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Focus Time (min)</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={workTime}
                  onChange={(e) => handleWorkChange(Number(e.target.value))}
                  className="w-16 rounded-md border border-white/15 bg-neutral-900 p-1 text-center text-xs font-bold text-white outline-none focus:border-[#38e1d6]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Break Time (min)</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakTime}
                  onChange={(e) => handleBreakChange(Number(e.target.value))}
                  className="w-16 rounded-md border border-white/15 bg-neutral-900 p-1 text-center text-xs font-bold text-white outline-none focus:border-[#38e1d6]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Long Break Time (min)</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={longBreakTime}
                  onChange={(e) => handleLongBreakChange(Number(e.target.value))}
                  className="w-16 rounded-md border border-white/15 bg-neutral-900 p-1 text-center text-xs font-bold text-white outline-none focus:border-[#38e1d6]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">Long Break Interval</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={longBreakInterval}
                  onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  className="w-16 rounded-md border border-white/15 bg-neutral-900 p-1 text-center text-xs font-bold text-white outline-none focus:border-[#38e1d6]"
                />
              </div>

              <div className="my-1 h-px w-full bg-white/10" />

              <label className="flex cursor-pointer items-center justify-between py-1">
                <span className="text-xs text-white/70">Auto-start Breaks</span>
                <input
                  type="checkbox"
                  checked={autoStartBreaks}
                  onChange={(e) => handleAutoBreakToggle(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-white/20 bg-neutral-900 text-[#38e1d6] accent-[#38e1d6]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between py-1">
                <span className="text-xs text-white/70">Auto-start Focus</span>
                <input
                  type="checkbox"
                  checked={autoStartFocus}
                  onChange={(e) => handleAutoFocusToggle(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-white/20 bg-neutral-900 text-[#38e1d6] accent-[#38e1d6]"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  Alarm Sound
                </span>
                <button
                  type="button"
                  onClick={() => previewAlarm(settings.alarmSound)}
                  disabled={settings.alarmSound === 'silent'}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Test Sound
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALARM_SOUNDS.map((s) => {
                  const active = settings.alarmSound === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        playClick()
                        updateSetting('alarmSound', s.value)
                      }}
                      aria-pressed={active}
                      className="rounded-lg border px-2 py-2 text-xs font-medium transition-colors duration-150"
                      style={{
                        borderColor: active
                          ? 'rgba(56,225,214,0.6)'
                          : 'rgba(255,255,255,0.1)',
                        background: active
                          ? 'rgba(56,225,214,0.12)'
                          : 'rgba(255,255,255,0.03)',
                        color: active ? '#7ff0e7' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-auto border-t border-white/10 px-5 py-4">
          <p className="text-xs text-white/50">
            Your preferences are saved automatically.
          </p>
        </footer>
      </aside>
    </>
  )
}
