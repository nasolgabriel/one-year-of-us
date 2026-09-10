const SRC = '/audio/theme.mp3'
const STORAGE_KEY = 'oneyearofus_music_muted'

const BASE_VOLUME = 0.4
const DUCK_VOLUME = 0.12
const FADE_MS = 700

let el: HTMLAudioElement | null = null
let userMuted = false
let ducked = false
let prefLoaded = false
let playing = false
let fadeRaf = 0
let armed = false

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

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

export function isMusicOn() {
  return !isMusicMuted() && playing
}

function targetVolume() {
  if (isMusicMuted()) return 0
  return ducked ? DUCK_VOLUME : BASE_VOLUME
}

function fadeTo(target: number) {
  const node = el
  if (!node) return
  cancelAnimationFrame(fadeRaf)
  const from = node.volume
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / FADE_MS)
    node.volume = Math.max(0, Math.min(1, from + (target - from) * t))
    if (t < 1) fadeRaf = requestAnimationFrame(step)
  }
  fadeRaf = requestAnimationFrame(step)
}

function ensureEl() {
  if (el) return el
  const node = new Audio(SRC)
  node.loop = true
  node.preload = 'auto'
  node.volume = 0
  node.addEventListener('play', () => {
    playing = true
    notify()
  })
  node.addEventListener('pause', () => {
    playing = false
    notify()
  })
  el = node
  return node
}

// A rejected play means the browser has seen no qualifying gesture yet, so the
// next one on the page starts it instead.
function armGesture() {
  if (armed) return
  armed = true
  const go = () => {
    window.removeEventListener('click', go)
    window.removeEventListener('keydown', go)
    armed = false
    attempt()
  }
  window.addEventListener('click', go)
  window.addEventListener('keydown', go)
}

function disarmGesture() {
  armed = false
}

function attempt() {
  if (isMusicMuted()) return
  const node = ensureEl()
  node.play().then(
    () => fadeTo(targetVolume()),
    () => armGesture(),
  )
}

export function startMusic() {
  ensureEl()
  attempt()
}

export function stopMusic() {
  cancelAnimationFrame(fadeRaf)
  el?.pause()
}

function persist(next: boolean) {
  prefLoaded = true
  userMuted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch {}
}

export function toggleMusic() {
  if (isMusicOn()) {
    persist(true)
    fadeTo(0)
    disarmGesture()
    notify()
    return
  }
  persist(false)
  attempt()
  notify()
}

export function duckMusic(next: boolean) {
  if (ducked === next) return
  ducked = next
  fadeTo(targetVolume())
}
