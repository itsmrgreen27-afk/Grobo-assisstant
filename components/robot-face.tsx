'use client'

import { motion, useAnimationControls } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Blink, Gaze } from '@/hooks/use-robot-eyes'
import type { EyeStyle } from '@/hooks/use-robot-settings'

type RobotFaceProps = {
  eyeColor: string
  eyeStyle: EyeStyle
  eyeScale: number
  eyeRoundness: number
  blink: Blink
  asleep: boolean
  gaze: Gaze
  alarm?: boolean
  compact?: boolean
}

type Side = 'left' | 'right'
type Reaction = null | 'wink-left' | 'wink-right' | 'double' | 'wobble'

const EYE_W = 'clamp(64px, 14vw, 132px)'
const EYE_H = 'clamp(96px, 20vw, 188px)'

function eyeGeometry(
  style: EyeStyle,
  side: Side,
  color: string,
  roundness: number,
): CSSProperties {
  switch (style) {
    case 'capsule':
      return {
        width: 'clamp(46px, 10vw, 92px)',
        height: EYE_H,
        borderRadius: '999px',
        background: color,
      }
    case 'anime':
      return {
        width: EYE_W,
        height: 'clamp(80px, 17vw, 160px)',
        borderRadius: '14px',
        background: color,
        clipPath:
          side === 'left'
            ? 'polygon(0% 22%, 100% 0%, 100% 100%, 0% 100%)'
            : 'polygon(0% 0%, 100% 22%, 100% 100%, 0% 100%)',
      }
    case 'neon':
      return {
        width: 'clamp(72px, 16vw, 148px)',
        height: 'clamp(16px, 3.4vw, 30px)',
        borderRadius: '999px',
        background: color,
        boxShadow: `0 0 10px ${color}, 0 0 22px ${color}bb, 0 0 40px ${color}66`,
      }
    default:
      return {
        width: EYE_W,
        height: EYE_H,
        borderRadius: `${roundness}%`,
        background: color,
      }
  }
}

function HappyEye({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 50"
      preserveAspectRatio="none"
      style={{ width: EYE_W, height: 'clamp(52px, 11vw, 104px)' }}
    >
      <path d="M 0 50 A 50 50 0 0 1 100 50 Z" fill={color} />
    </svg>
  )
}

function Eye({
  side,
  style,
  color,
  roundness,
  closed,
  happy,
}: {
  side: Side
  style: EyeStyle
  color: string
  roundness: number
  closed: boolean
  happy: boolean
}) {
  if (happy || style === 'arched') {
    return <HappyEye color={color} />
  }

  const geo = eyeGeometry(style, side, color, roundness)

  return (
    <div
      className="transition-[height,border-radius] duration-150 ease-out will-change-transform"
      style={{
        ...geo,
        height: closed ? '10px' : (geo.height as string),
        borderRadius: closed ? '999px' : (geo.borderRadius as string),
      }}
    />
  )
}

export function RobotFace({
  eyeColor,
  eyeStyle,
  eyeScale,
  eyeRoundness,
  blink,
  asleep,
  gaze,
  alarm = false,
  compact = false,
}: RobotFaceProps) {
  const controls = useAnimationControls()
  const [reaction, setReaction] = useState<Reaction>(null)
  const [reactBlink, setReactBlink] = useState<Blink | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const maxShift = compact ? 10 : 18
  const translate = `translate3d(${gaze.x * maxShift}px, ${gaze.y * maxShift}px, 0) scale(${eyeScale})`

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const track = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay)
    timers.current.push(id)
  }, [])

  useEffect(() => {
    if (alarm) {
      controls.start({
        x: [0, -7, 7, -6, 6, -3, 3, 0],
        rotate: [0, -5, 5, -4, 4, -2, 2, 0],
        transition: { duration: 0.55, repeat: Infinity, ease: 'easeInOut' },
      })
    } else {
      controls.stop()
      controls.start({
        x: 0,
        rotate: 0,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.25 },
      })
    }
  }, [alarm, controls])

  useEffect(() => () => clearTimers(), [clearTimers])

  const handleTap = useCallback(() => {
    if (alarm) return
    clearTimers()
    const roll = Math.floor(Math.random() * 3)

    if (roll === 0) {
      const side: Reaction = Math.random() < 0.5 ? 'wink-left' : 'wink-right'
      setReaction(side)
      setReactBlink({
        left: side === 'wink-left',
        right: side === 'wink-right',
      })
      track(() => {
        setReactBlink(null)
        setReaction(null)
      }, 300)
    } else if (roll === 1) {
      setReactBlink({ left: true, right: true })
      track(() => setReactBlink({ left: false, right: false }), 110)
      track(() => setReactBlink({ left: true, right: true }), 220)
      track(() => setReactBlink(null), 340)
    } else {
      setReaction('wobble')
      controls
        .start({
          scaleX: [1, 1.18, 0.9, 1.05, 1],
          scaleY: [1, 0.82, 1.12, 0.97, 1],
          transition: { duration: 0.6, ease: 'easeInOut' },
        })
        .then(() => setReaction((r) => (r === 'wobble' ? null : r)))
    }
  }, [alarm, clearTimers, controls, track])

  const happy = false
  const effectiveBlink = reactBlink ?? blink
  const leftClosed = effectiveBlink.left || asleep
  const rightClosed = effectiveBlink.right || asleep

  return (
    <div
      className={compact ? 'relative flex items-center justify-center' : 'relative flex items-center justify-center animate-robo-float'}
      style={{
        width: 'clamp(220px, 45vw, 420px)',
        height: EYE_H,
      }}
      role="img"
      aria-label={asleep ? 'Robot sleeping' : 'Robot looking around. Tap to interact.'}
    >
      {/* Sleepy Zzz */}
      <div
        className="pointer-events-none absolute -right-2 -top-6 flex flex-col items-start gap-1 transition-opacity duration-500"
        style={{ opacity: asleep ? 1 : 0 }}
        aria-hidden="true"
      >
        <span className="text-lg font-semibold text-foreground/40">z</span>
        <span className="-mt-4 ml-3 text-2xl font-semibold text-foreground/30">
          Z
        </span>
      </div>

      <button
        type="button"
        onClick={handleTap}
        aria-label="Poke the robot"
        className="relative flex items-center justify-center cursor-pointer select-none rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {/* الحاوية الداخلية فقط هي من تتحرك بالـ translate مع حماية الهيكل الخارجي من الاهتزاز */}
        <div
          className="transition-transform duration-200 ease-out will-change-transform flex items-center justify-center"
          style={{ transform: translate }}
        >
          <motion.div
            className="flex items-center justify-center will-change-transform"
            style={{ gap: 'clamp(18px, 4vw, 44px)' }}
            animate={controls}
          >
            <Eye
              side="left"
              style={eyeStyle}
              color={eyeColor}
              roundness={eyeRoundness}
              closed={leftClosed}
              happy={happy}
            />
            <Eye
              side="right"
              style={eyeStyle}
              color={eyeColor}
              roundness={eyeRoundness}
              closed={rightClosed}
              happy={happy}
            />
          </motion.div>
        </div>
      </button>
    </div>
  )
}
