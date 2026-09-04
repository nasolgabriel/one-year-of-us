const SRC = '/audio/theme.mp3'
const STORAGE_KEY = 'oneyearofus_music_muted'

const BASE_VOLUME = 0.4
const DUCK_VOLUME = 0.12
const FADE_MS = 700

let el: HTMLAudioElement | null = null
let userMuted = false
let ducked = false
let prefLoaded = false
let fadeRaf = 0
let armed = false

const listeners = new Set<() => void>()

export function subscribeMusic(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function isMusicMuted() {
  if (!prefLoaded) {
    prefLoaded = true
    try {
      userMuted = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {}
  }
  return userMuted
}

function targetVolume() {
  if (isMusicMuted()) return 0
  return ducked ? DUCK_VOLUME : BASE_VOLUME
}

function fadeTo(target: number) {
  if (!el) return
  cancelAnimationFrame(fadeRaf)
  const node = el
  const from = node.volume
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / FADE_MS)
    node.volume = Math.max(0, Math.min(1, from + (target - from) * t))
    if (t < 1) fadeRaf = requestAnimationFrame(step)
  }
  fadeRaf = requestAnimationFrame(step)
}

// Autoplay with sound needs a gesture. An unlock reached by the countdown
// hitting zero never had one, so a rejected play arms the next tap instead.
function armGesture() {
  if (armed) return
  armed = true
  const go = () => {
    window.removeEventListener('pointerdown', go)
    window.removeEventListener('keydown', go)
    armed = false
    attempt()
  }
  window.addEventListener('pointerdown', go)
  window.addEventListener('keydown', go)
}

function attempt() {
  if (!el || isMusicMuted()) return
  el.play().then(
    () => fadeTo(targetVolume()),
    () => armGesture(),
  )
}

export function startMusic() {
  if (el) return
  el = new Audio(SRC)
  el.loop = true
  el.preload = 'auto'
  el.volume = 0
  attempt()
}

export function stopMusic() {
  cancelAnimationFrame(fadeRaf)
  el?.pause()
  el = null
  armed = false
  ducked = false
}

export function setMusicMuted(next: boolean) {
  prefLoaded = true
  userMuted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch {}
  if (next) fadeTo(0)
  else attempt()
  listeners.forEach((fn) => fn())
}

export function duckMusic(next: boolean) {
  if (ducked === next) return
  ducked = next
  fadeTo(targetVolume())
}
