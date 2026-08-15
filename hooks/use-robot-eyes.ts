'use client'

import { useEffect, useRef, useState } from 'react'

export type Gaze = { x: number; y: number }
export type Blink = { left: boolean; right: boolean }

export type EyeOptions = {
  lookAround: boolean
  winking: boolean
  idleSleep: boolean
}

const SLEEP_AFTER_MS = 30_000

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

/**
 * Drives the robot's autonomous, expressive eye behavior:
 * - Natural single blinks, occasional quick double-blinks, and playful winks
 * - Snappy glances left / right (and slightly up/down)
 * - Falls asleep after 30s of no user interaction, and wakes on any input
 *
 * Each behavior can be individually disabled via options.
 */
export function useRobotEyes(options: EyeOptions) {
  const { lookAround, winking, idleSleep } = options

  const [blink, setBlink] = useState<Blink>({ left: false, right: false })
  const [asleep, setAsleep] = useState(false)
  const [gaze, setGaze] = useState<Gaze>({ x: 0, y: 0 })

  const asleepRef = useRef(false)
  const optionsRef = useRef(options)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blinkTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    asleepRef.current = asleep
  }, [asleep])

  // Keep the latest option values available to the running loops.
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  // Inactivity -> sleep, and wake on interaction.
  useEffect(() => {
    const resetInactivity = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (asleepRef.current) setAsleep(false)
      if (!optionsRef.current.idleSleep) return
      inactivityTimer.current = setTimeout(() => setAsleep(true), SLEEP_AFTER_MS)
    }

    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'pointermove',
      'keydown',
      'touchstart',
      'wheel',
    ]
    events.forEach((e) =>
      window.addEventListener(e, resetInactivity, { passive: true }),
    )
    resetInactivity()

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivity))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [])

  // If idle-sleep is turned off, wake immediately and cancel any pending sleep.
  useEffect(() => {
    if (!idleSleep) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      setAsleep(false)
    }
  }, [idleSleep])

  // Expressive blink loop: single blink, quick double-blink, or a wink.
  useEffect(() => {
    let scheduleTimer: ReturnType<typeof setTimeout>

    const track = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay)
      blinkTimers.current.push(id)
      return id
    }

    const both = (v: boolean) => setBlink({ left: v, right: v })

    const performExpression = () => {
      const roll = Math.random()
      const canWink = optionsRef.current.winking

      if (canWink && roll < 0.16) {
        // Playful wink — one eye only.
        const wink = Math.random() < 0.5 ? 'left' : 'right'
        setBlink({ left: wink === 'left', right: wink === 'right' })
        track(() => both(false), 280)
      } else if (roll < 0.4) {
        // Quick double-blink.
        both(true)
        track(() => both(false), 100)
        track(() => both(true), 210)
        track(() => both(false), 310)
      } else {
        // Natural single blink.
        both(true)
        track(() => both(false), 130)
      }
    }

    const scheduleBlink = () => {
      scheduleTimer = setTimeout(
        () => {
          if (!asleepRef.current) performExpression()
          scheduleBlink()
        },
        randomBetween(1800, 4600),
      )
    }
    scheduleBlink()

    return () => {
      clearTimeout(scheduleTimer)
      blinkTimers.current.forEach(clearTimeout)
      blinkTimers.current = []
    }
  }, [])

  // Gaze loop — dart around sharply when awake and enabled.
  useEffect(() => {
    let gazeTimeout: ReturnType<typeof setTimeout>

    const scheduleGaze = () => {
      gazeTimeout = setTimeout(
        () => {
          if (!asleepRef.current && optionsRef.current.lookAround) {
            const x = Math.round(randomBetween(-1, 1) * 100) / 100
            const y = Math.round(randomBetween(-0.55, 0.55) * 100) / 100
            setGaze({ x, y })
          } else {
            setGaze({ x: 0, y: 0 })
          }
          scheduleGaze()
        },
        randomBetween(1200, 3200),
      )
    }
    scheduleGaze()

    return () => clearTimeout(gazeTimeout)
  }, [])

  // Recenter gaze when falling asleep or when look-around is disabled.
  useEffect(() => {
    if (asleep || !lookAround) setGaze({ x: 0, y: 0 })
  }, [asleep, lookAround])

  return { blink, asleep, gaze }
}
