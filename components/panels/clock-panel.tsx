'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

export function ClockPanel({ digitStyle }: { digitStyle?: CSSProperties }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) {
    return <div className="h-[72px]" aria-hidden="true" />
  }

  const time = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <span
      className="text-7xl font-bold tabular-nums tracking-tight sm:text-8xl"
      style={{ ...digitStyle, textShadow: '0 2px 24px rgba(0,0,0,0.45)' }}
    >
      {time}
    </span>
  )
}
