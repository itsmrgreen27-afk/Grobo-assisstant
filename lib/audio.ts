// Pure Web Audio API sound engine — zero external file dependencies.
// Synthesizes UI ticks and looping alarm patterns on demand.

export type AlarmSound = 'beep' | 'chime' | 'synth' | 'silent'

export const ALARM_SOUNDS: { name: string; value: AlarmSound }[] = [
  { name: 'Digital Beep', value: 'beep' },
  { name: 'Soft Chime', value: 'chime' },
  { name: 'Cute Synth', value: 'synth' },
  { name: 'Silent', value: 'silent' },
]

let ctx: AudioContext | null = null
let muted = false

/** Toggle global mute; returns the new muted state. */
export function toggleMute(): boolean {
  muted = !muted
  if (muted) stopAlarm()
  return muted
}

/** Explicitly set the global mute state. */
export function setMuted(value: boolean) {
  muted = value
  if (muted) stopAlarm()
}

/** Whether audio output is currently muted. */
export function isMuted(): boolean {
  return muted
}

/** Lazily create (and resume) a shared AudioContext after a user gesture. */
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

/** Warm up the audio context on the first user interaction. */
export function primeAudio() {
  getCtx()
}

type ToneOptions = {
  freq: number
  start: number
  duration: number
  type?: OscillatorType
  peak?: number
  glide?: number
}

/** Play a single enveloped tone at an absolute context time. */
function tone(audio: AudioContext, opts: ToneOptions) {
  if (muted) return
  const { freq, start, duration, type = 'sine', peak = 0.18, glide } = opts
  const osc = audio.createOscillator()
  const gain = audio.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (glide) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, glide),
      start + duration,
    )
  }

  // Quick attack, smooth exponential release for a clean, non-clicky envelope.
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain).connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

/** A subtle, quiet click for UI toggles. */
export function playClick() {
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime
  tone(audio, {
    freq: 320,
    start: now,
    duration: 0.05,
    type: 'triangle',
    peak: 0.06,
    glide: 180,
  })
}

/**
 * Render one cycle of the given alarm voice starting at `at`.
 * Returns the cycle length in seconds so the loop can reschedule.
 */
function renderCycle(audio: AudioContext, sound: AlarmSound, at: number): number {
  switch (sound) {
    case 'beep': {
      // Insistent double square-wave beep.
      tone(audio, { freq: 880, start: at, duration: 0.14, type: 'square', peak: 0.16 })
      tone(audio, { freq: 880, start: at + 0.22, duration: 0.14, type: 'square', peak: 0.16 })
      return 0.9
    }
    case 'chime': {
      // Gentle two-note bell (perfect fifth) with soft sine tones.
      tone(audio, { freq: 660, start: at, duration: 0.5, type: 'sine', peak: 0.16 })
      tone(audio, { freq: 990, start: at + 0.28, duration: 0.6, type: 'sine', peak: 0.13 })
      return 1.4
    }
    case 'synth': {
      // Playful ascending triangle arpeggio.
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((f, i) =>
        tone(audio, {
          freq: f,
          start: at + i * 0.12,
          duration: 0.18,
          type: 'triangle',
          peak: 0.14,
        }),
      )
      return 1.1
    }
    default:
      return 1
  }
}

let alarmTimer: ReturnType<typeof setInterval> | null = null

/** Start looping the selected alarm until stopAlarm() is called. */
export function startAlarm(sound: AlarmSound) {
  stopAlarm()
  if (sound === 'silent') return
  const audio = getCtx()
  if (!audio) return

  const cycle = renderCycle(audio, sound, audio.currentTime + 0.02)
  alarmTimer = setInterval(() => {
    const a = getCtx()
    if (!a) return
    renderCycle(a, sound, a.currentTime + 0.02)
  }, Math.max(300, cycle * 1000))
}

/** Stop any looping alarm. */
export function stopAlarm() {
  if (alarmTimer) {
    clearInterval(alarmTimer)
    alarmTimer = null
  }
}

/** Play a single preview cycle of an alarm voice (for the Test button). */
export function previewAlarm(sound: AlarmSound) {
  if (sound === 'silent') return
  const audio = getCtx()
  if (!audio) return
  renderCycle(audio, sound, audio.currentTime + 0.02)
}
