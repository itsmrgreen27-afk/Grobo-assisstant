'use client'

import { useEffect } from 'react'

export type ShortcutHandlers = {
  /** Space — play / pause the active timer or pomodoro. */
  onTogglePlay: () => void
  /** R — reset the active timer or pomodoro. */
  onReset?: () => void
  /** M — toggle audio mute. */
  onToggleMute: () => void
  /** F — toggle zen / fullscreen focus mode. */
  onToggleZen: () => void
  /** Escape — exit zen mode (only fires while zen is active). */
  onExitZen: () => void
  /** ArrowRight — switch to next mode. */
  onNextMode?: () => void
  /** ArrowLeft — switch to previous mode. */
  onPrevMode?: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const {
    onTogglePlay,
    onReset,
    onToggleMute,
    onToggleZen,
    onExitZen,
    onNextMode,
    onPrevMode,
  } = handlers

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditableTarget(e.target)) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          onTogglePlay()
          break
        case 'KeyR':
          e.preventDefault()
          onReset?.()
          break
        case 'KeyM':
          e.preventDefault()
          onToggleMute()
          break
        case 'KeyF':
          e.preventDefault()
          onToggleZen()
          break
        case 'Escape':
          onExitZen()
          break
        case 'ArrowRight':
          e.preventDefault()
          onNextMode?.()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onPrevMode?.()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    onTogglePlay,
    onReset,
    onToggleMute,
    onToggleZen,
    onExitZen,
    onNextMode,
    onPrevMode,
  ])
}
