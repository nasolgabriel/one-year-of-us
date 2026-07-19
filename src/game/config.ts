import { COLORS } from '@/lib/constants'

// Fixed virtual height; width is derived from the container aspect at boot so
// the game fills its section with no letterbox bars. All sizes below are in
// virtual pixels.
export const VIRTUAL_HEIGHT = 240

export const GROUND_HEIGHT = 40

// The bike stays fixed at this fraction of the viewport width; the world
// scrolls left past it.
export const PLAYER_X_FRAC = 0.25

// World scroll speed at full ride pace, virtual px/sec.
export const RIDE_SPEED = 120

// The whole ride on one distance axis (virtual px). ~60s alone, a wordless
// pickup beat, then ~95s together at RIDE_SPEED.
export const TIMELINE = {
  sophiePickup: 7200,
  finish: 18600,
} as const

export type Act = 1 | 3

// Act 2 is the pickup moment itself, not a stretch of road.
export function actAt(distance: number): Act {
  return distance < TIMELINE.sophiePickup ? 1 : 3
}

// Background colour stops across the ride — morning green into golden hour.
export const SKY_STOPS: [number, string][] = [
  [0, COLORS.green],
  [TIMELINE.sophiePickup, COLORS.green],
  [TIMELINE.finish, COLORS.peach],
]

export const GROUND_STOPS: [number, string][] = [
  [0, COLORS.amber],
  [TIMELINE.sophiePickup, COLORS.amber],
  [TIMELINE.finish, COLORS.twilight],
]

// Hills and the grass fringe recolor with the sunset; the fringe leads so the
// roadside warms slightly ahead of the far hills (art pass scene 03).
export const HILL_STOPS: [number, string][] = [
  [0, COLORS.mintDark],
  [TIMELINE.sophiePickup, COLORS.mintDark],
  [TIMELINE.finish, COLORS.rose],
]

export const FRINGE_STOPS: [number, string][] = [
  [0, COLORS.mintDark],
  [TIMELINE.sophiePickup, COLORS.mintDark],
  [TIMELINE.sophiePickup + (TIMELINE.finish - TIMELINE.sophiePickup) * 0.8, COLORS.rose],
  [TIMELINE.finish, COLORS.rose],
]

export const HOP = {
  velocity: -260,
  gravity: 640,
} as const

// Riding bob: subtle up-only bounce while grounded.
export const BOB = {
  freq: 9,
  amp: 1.5,
} as const

// Path dash marks — distance between spawns, virtual px.
export const DASH_SPACING = 90

// Ambient decoration pacing.
export const DECOR = {
  tuftSpacing: 150,
  petalEvery: 1.1,
} as const

// Distance gaps between spawns, [min, max] virtual px. Distance-based, so the
// memory-mode slowdown stretches spawn timing for free.
export const SPAWN = {
  obstacleGap: [180, 320],
  collectibleGap: [70, 140],
} as const

// Generous pickup magnet radius around the rider's chest.
export const COLLECT_RADIUS = 16

// Bump wobble duration after clipping an obstacle, seconds.
export const BUMP_TIME = 0.45

// Memory mode — the world settles to slowScale over `slowdown` seconds, the
// card shows, then speeds back up over `speedup` on "keep riding →".
export const MEMORY = {
  slowScale: 0.2,
  slowdown: 0.8,
  speedup: 0.8,
  overlayOpacity: 0.16,
} as const

// Act 2 pickup beat. Sophie spawns `lead` px of road before the pickup point
// and rides in with the world; the bike brakes once she reaches `stopX`
// (fraction of viewport width). All times in seconds.
export const SOPHIE = {
  lead: 200,
  stopX: 0.55,
  stopTime: 0.7,
  swishTime: 0.9,
  arcTime: 0.55,
  restartDelay: 0.6,
} as const

// Finish tableau — spawned so the garland/she/balloon come to rest on screen
// after the brake tween. brakeDistance ≈ RIDE_SPEED · 1.4s · ∫easeOutQuad = /3.
export const FINISH_ART = {
  brakeDistance: 56,
} as const

// Scrolling objects are destroyed once past this x.
export const SCROLL_CULL_X = -40

