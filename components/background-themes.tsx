'use client'

import { useEffect, useRef } from 'react'
import type { BackgroundEffect } from '@/hooks/use-robot-settings'

type BackgroundThemesProps = {
  effect: BackgroundEffect
  color: string
  /** When true (light background), particles are drawn darker for contrast. */
  light?: boolean
}

/**
 * Lightweight ambient background. Rain & snow use a single low-density canvas
 * with a capped particle count; clouds, grid and solid are pure CSS so they
 * cost nothing on the main thread. No pointer / cursor tracking.
 */
export function BackgroundThemes({ effect, color, light }: BackgroundThemesProps) {
  if (effect === 'rain' || effect === 'snow') {
    return <ParticleCanvas key={effect} kind={effect} color={color} light={light} />
  }
  if (effect === 'clouds') return <Clouds color={color} light={light} />
  if (effect === 'grid') return <CyberGrid color={color} />
  return null // 'solid' — the container background is enough.
}

/* --------------------------------- Canvas -------------------------------- */

type Particle = {
  x: number
  y: number
  len: number // rain streak length / snow radius
  speed: number
  drift: number
  alpha: number
}

function ParticleCanvas({
  kind,
  color,
  light,
}: {
  kind: 'rain' | 'snow'
  color: string
  light?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let dpr = 1
    let particles: Particle[] = []
    let raf = 0

    const stroke = light ? 'rgba(40,52,74,' : hexToRgbaPrefix(color)

    function makeParticles() {
      // Cap density relative to viewport area, but keep it low for perf.
      const area = width * height
      const target =
        kind === 'rain'
          ? Math.min(140, Math.round(area / 14000))
          : Math.min(90, Math.round(area / 22000))
      particles = Array.from({ length: target }, () => spawn(true))
    }

    function spawn(initial: boolean): Particle {
      if (kind === 'rain') {
        return {
          x: Math.random() * width,
          y: initial ? Math.random() * height : -20,
          len: 10 + Math.random() * 16,
          speed: 6 + Math.random() * 6,
          drift: 0.6 + Math.random() * 0.8,
          alpha: 0.25 + Math.random() * 0.4,
        }
      }
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : -10,
        len: 1.4 + Math.random() * 2.6,
        speed: 0.5 + Math.random() * 1.1,
        drift: -0.6 + Math.random() * 1.2,
        alpha: 0.4 + Math.random() * 0.5,
      }
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      width = canvas!.clientWidth
      height = canvas!.clientHeight
      canvas!.width = Math.floor(width * dpr)
      canvas!.height = Math.floor(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      makeParticles()
    }

    let t = 0
    function frame() {
      ctx!.clearRect(0, 0, width, height)
      t += 0.02

      for (const p of particles) {
        if (kind === 'rain') {
          p.y += p.speed
          p.x += p.drift
          ctx!.strokeStyle = `${stroke}${p.alpha})`
          ctx!.lineWidth = 1.1
          ctx!.beginPath()
          ctx!.moveTo(p.x, p.y)
          ctx!.lineTo(p.x - p.drift * 1.4, p.y - p.len)
          ctx!.stroke()
          if (p.y - p.len > height) Object.assign(p, spawn(false))
        } else {
          p.y += p.speed
          p.x += Math.sin(t + p.y * 0.01) * 0.4 + p.drift * 0.3
          ctx!.fillStyle = `${stroke}${p.alpha})`
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, p.len, 0, Math.PI * 2)
          ctx!.fill()
          if (p.y - p.len > height) Object.assign(p, spawn(false))
        }
      }
      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)

    if (reduce) {
      // Draw a single static frame for reduced-motion users.
      ctx.clearRect(0, 0, width, height)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [kind, color, light])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}

/* --------------------------------- Clouds -------------------------------- */

function Clouds({ color, light }: { color: string; light?: boolean }) {
  const strokeColor = light ? 'rgba(80,100,120,0.35)' : `${normalizeHex(color)}55`
  const fillColor = light ? 'rgba(120,140,165,0.15)' : `${normalizeHex(color)}18`

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Crisp Vector Cloud 1 */}
      <div className="animate-cloud-drift absolute -left-[20%] top-[12%] w-[320px] opacity-70 sm:w-[420px]">
        <svg viewBox="0 0 240 120" className="w-full h-auto drop-shadow-sm">
          <path
            d="M 30 90 Q 10 90 10 70 Q 10 50 35 45 Q 45 20 75 20 Q 105 20 115 40 Q 135 25 160 35 Q 185 45 180 70 Q 200 70 200 90 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Crisp Vector Cloud 2 */}
      <div className="animate-cloud-drift-slow absolute -left-[30%] top-[45%] w-[380px] opacity-50 sm:w-[500px]">
        <svg viewBox="0 0 240 120" className="w-full h-auto drop-shadow-sm">
          <path
            d="M 20 85 Q 5 85 5 68 Q 5 50 28 42 Q 40 15 70 15 Q 98 15 110 32 Q 130 18 155 28 Q 180 38 175 62 Q 195 62 195 85 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Crisp Vector Cloud 3 */}
      <div
        className="animate-cloud-drift absolute -left-[25%] top-[70%] w-[280px] opacity-60 sm:w-[360px]"
        style={{ animationDelay: '-14s' }}
      >
        <svg viewBox="0 0 240 120" className="w-full h-auto drop-shadow-sm">
          <path
            d="M 30 90 Q 10 90 10 70 Q 10 50 35 45 Q 45 20 75 20 Q 105 20 115 40 Q 135 25 160 35 Q 185 45 180 70 Q 200 70 200 90 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

/* ------------------------------- Cyber Grid ------------------------------ */

function CyberGrid({ color }: { color: string }) {
  const line = `${normalizeHex(color)}22`
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 78%)' }}
    >
      <div
        className="animate-grid-pan absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}

/* --------------------------------- Utils --------------------------------- */

function normalizeHex(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
  }
  return `#${clean.slice(0, 6)}`
}

/** Turn a hex color into an "rgba(r,g,b," prefix so callers append alpha. */
function hexToRgbaPrefix(hex: string) {
  const clean = normalizeHex(hex).replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},`
}