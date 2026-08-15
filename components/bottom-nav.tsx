'use client'

import { Bot, Clock, Hourglass, ListTodo, Settings, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { playClick } from '@/lib/audio'

export type Mode = 'robot' | 'pomodoro' | 'timer' | 'clock'

const MODES: { id: Mode; label: string; icon: LucideIcon }[] = [
  { id: 'robot', label: 'Robot Only', icon: Bot },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { id: 'timer', label: 'Timer', icon: Hourglass },
  { id: 'clock', label: 'Clock', icon: Clock },
]

type BottomNavProps = {
  mode: Mode
  onModeChange: (mode: Mode) => void
  onOpenSettings: () => void
  onOpenTodo: () => void
  accent: string
}

export function BottomNav({
  mode,
  onModeChange,
  onOpenSettings,
  onOpenTodo,
  accent,
}: BottomNavProps) {
  return (
    <nav
      aria-label="Assistant modes"
      className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4"
    >
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/5">
        {MODES.map(({ id, label, icon: Icon }) => {
          const active = mode === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                playClick()
                onModeChange(id)
              }}
              aria-pressed={active}
              aria-label={label}
              title={label}
              className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/10 sm:w-auto sm:gap-2 sm:px-4"
              style={
                active
                  ? { background: `${accent}22`, color: accent }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span
                className="hidden text-sm font-medium sm:inline"
                style={active ? { color: accent } : undefined}
              >
                {label}
              </span>
            </button>
          )
        })}

        <span className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />

        {/* Todo List Button */}
        <button
          type="button"
          onClick={() => {
            playClick()
            onOpenTodo()
          }}
          aria-label="Open todo list"
          title="Todo List"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground"
        >
          <ListTodo className="h-5 w-5" />
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={() => {
            playClick()
            onOpenSettings()
          }}
          aria-label="Open settings"
          title="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </nav>
  )
}