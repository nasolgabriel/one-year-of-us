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

// Scrolling objects are destroyed once past this x.
export const SCROLL_CULL_X = -40

export const SKY_COLOR = COLORS.green
export const GROUND_COLOR = COLORS.amber
