import { SFX } from './config'

const STORAGE_KEY = 'oneyearofus_ride_muted'

let actx: AudioContext | null = null
let master: GainNode | null = null
let userMuted = false
let suspended = false

function targetGain() {
  return userMuted || suspended ? 0 : SFX.master
}

function applyGain(ramp: number = SFX.fade) {
  if (!actx || !master) return
  const t = actx.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(master.gain.value, t)
  master.gain.linearRampToValueAtTime(targetGain(), t + ramp)
}

export function initAudio(context: AudioContext | undefined | null) {
  if (!context || typeof context.createGain !== 'function') return
  if (actx === context && master) return
  actx = context
  master = context.createGain()
  master.gain.value = 0
  master.connect(context.destination)
  isMuted()
  applyGain(0)
}

export function destroyAudio() {
  try {
    master?.disconnect()
  } catch {}
  master = null
  actx = null
  suspended = false
}

export function unlockAudio() {
  if (!actx) return
  if (actx.state === 'suspended') void actx.resume().catch(() => {})
  suspended = false
  applyGain()
}

// kaplay calls audioCtx.resume() itself whenever debug.paused is true, so
// suspending the context is undone immediately — silence has to happen here.
export function setAudioSuspended(next: boolean) {
  suspended = next
  applyGain()
}

const muteListeners = new Set<() => void>()

export function subscribeMute(fn: () => void) {
  muteListeners.add(fn)
  return () => {
    muteListeners.delete(fn)
  }
}

let prefLoaded = false

export function isMuted() {
  if (!prefLoaded) {
    prefLoaded = true
    try {
      userMuted = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {}
  }
  return userMuted
}

export function setMuted(next: boolean) {
  prefLoaded = true
  userMuted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch {}
  applyGain()
  muteListeners.forEach((fn) => fn())
}

type ToneSpec = {
  type?: OscillatorType
  freq: number
  to?: number
  dur: number
  gain?: number
  attack?: number
  delay?: number
  detune?: number
  filter?: number
  filterTo?: number
  q?: number
}

function tone(s: ToneSpec) {
  if (!actx || !master || targetGain() === 0) return
  const t0 = actx.currentTime + (s.delay ?? 0)
  const dur = s.dur
  const peak = s.gain ?? 0.2
  const attack = Math.min(s.attack ?? 0.008, dur * 0.5)

  const osc = actx.createOscillator()
  osc.type = s.type ?? 'triangle'
  if (s.detune) osc.detune.value = s.detune
  osc.frequency.setValueAtTime(s.freq, t0)
  if (s.to) osc.frequency.exponentialRampToValueAtTime(s.to, t0 + dur)

  const env = actx.createGain()
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(peak, t0 + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  env.gain.setValueAtTime(0, t0 + dur)

  let node: AudioNode = osc
  let filter: BiquadFilterNode | null = null
  if (s.filter) {
    filter = actx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(s.filter, t0)
    if (s.filterTo) filter.frequency.exponentialRampToValueAtTime(s.filterTo, t0 + dur)
    filter.Q.value = s.q ?? 1
    osc.connect(filter)
    node = filter
  }
  node.connect(env)
  env.connect(master)

  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
  osc.onended = () => {
    try {
      osc.disconnect()
      filter?.disconnect()
      env.disconnect()
    } catch {}
  }
}

export function sfxHop() {
  tone({ freq: 330, to: 560, dur: 0.09, gain: SFX.hop, attack: 0.004 })
}

let comboStep = 0
let lastCollect = -Infinity

export function resetCombo() {
  comboStep = 0
  lastCollect = -Infinity
}

export function sfxCollect() {
  const now = actx?.currentTime ?? 0
  comboStep =
    now - lastCollect < SFX.comboWindow ? Math.min(comboStep + 1, SFX.comboMax) : 0
  lastCollect = now
  const root = 660 * Math.pow(2, comboStep / 12)
  tone({ freq: root, dur: 0.075, gain: SFX.collect, attack: 0.003 })
  tone({ freq: root * 1.5, dur: 0.11, gain: SFX.collect * 0.75, attack: 0.003, delay: 0.04 })
}

export function sfxHit() {
  tone({ type: 'square', freq: 220, to: 70, dur: 0.17, gain: SFX.hit * 0.55, attack: 0.002, filter: 900 })
  tone({ freq: 150, to: 55, dur: 0.22, gain: SFX.hit, attack: 0.002, detune: -12 })
}

const C5 = 523.25

export function sfxMilestone() {
  const notes = [1, 1.26, 1.5, 2]
  notes.forEach((r, i) => {
    tone({
      type: 'sine',
      freq: C5 * r,
      dur: 0.5 - i * 0.05,
      gain: SFX.milestone * (1 - i * 0.12),
      attack: 0.02,
      delay: i * 0.1,
    })
  })
}

export function sfxFinish() {
  const notes = [1, 1.26, 1.5, 2, 2.52]
  notes.forEach((r, i) => {
    tone({
      type: 'sine',
      freq: C5 * r,
      dur: 0.42,
      gain: SFX.finish * 0.55,
      attack: 0.02,
      delay: i * 0.11,
    })
  })
  tone({ type: 'sine', freq: C5 * 2, dur: 1.2, gain: SFX.finish * 0.5, attack: 0.1, delay: 0.55 })
  tone({ type: 'sine', freq: C5 * 3, dur: 1.0, gain: SFX.finish * 0.22, attack: 0.14, delay: 0.6 })
}

// High-Q lowpass stands in for a vocal formant; the sweep opens the vowel so
// the two segments read as "me-ow" rather than a synth sweep.
export function sfxMeow() {
  tone({
    type: 'sawtooth',
    freq: 480,
    to: 760,
    dur: 0.16,
    gain: SFX.meow * 0.8,
    attack: 0.03,
    filter: 1500,
    filterTo: 1800,
    q: 9,
  })
  tone({
    type: 'sawtooth',
    freq: 740,
    to: 380,
    dur: 0.3,
    gain: SFX.meow,
    attack: 0.02,
    delay: 0.14,
    filter: 1400,
    filterTo: 900,
    q: 11,
  })
}
