import { COLORS } from '@/lib/constants'
import {
  DASH_SPACING,
  GROUND_HEIGHT,
  GROUND_STOPS,
  RIDE_SPEED,
  SCROLL_CULL_X,
  SKY_STOPS,
  VIRTUAL_HEIGHT,
} from './config'
import type { RideCtx } from './types'

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Piecewise-linear colour over the distance axis.
export function sampleStops(stops: [number, string][], d: number): [number, number, number] {
  if (d <= stops[0][0]) return hexToRgb(stops[0][1])
  for (let i = 1; i < stops.length; i++) {
    if (d <= stops[i][0]) {
      const t = (d - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0])
      const a = hexToRgb(stops[i - 1][1])
      const b = hexToRgb(stops[i][1])
      return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t),
      ]
    }
  }
  return hexToRgb(stops[stops.length - 1][1])
}

export const GROUND_Y = VIRTUAL_HEIGHT - GROUND_HEIGHT

export function worldSpeed(ctx: RideCtx): number {
  return RIDE_SPEED * ctx.speedScale
}

// Ground strip, parallax hills/bushes, and the scroll driver. Everything
// tagged 'scrolling' moves left at world speed and is culled off the left
// edge; 'parallax' strips move at a fraction of it and wrap. ctx.distance is
// the master clock every other module keys off.
// z-order: hills 0 · bushes 1 · ground 2 · dashes 3 · gameplay objects above.
export function setupWorld(ctx: RideCtx) {
  const { k } = ctx
  const W = k.width()

  // Two copies of each strip leapfrog to fake an infinite layer.
  const addStrip = (z: number, factor: number, build: (strip: ReturnType<typeof k.add>) => void) => {
    for (const offset of [0, W]) {
      const strip = k.add([k.pos(offset, 0), k.z(z), { factor, stripW: W }, 'parallax'])
      build(strip)
    }
  }

  const mintDark = hexToRgb(COLORS.mintDark)

  addStrip(0, 0.25, (strip) => {
    strip.add([k.circle(56), k.pos(W * 0.2, GROUND_Y + 30), k.color(...mintDark), k.opacity(0.3)])
    strip.add([k.circle(74), k.pos(W * 0.58, GROUND_Y + 44), k.color(...mintDark), k.opacity(0.3)])
    strip.add([k.circle(48), k.pos(W * 0.92, GROUND_Y + 26), k.color(...mintDark), k.opacity(0.3)])
  })

  addStrip(1, 0.55, (strip) => {
    for (const [fx, r] of [[0.12, 11], [0.34, 8], [0.62, 13], [0.83, 9]] as const) {
      strip.add([k.circle(r), k.pos(W * fx, GROUND_Y + 2), k.color(...mintDark), k.opacity(0.6)])
    }
  })

  const ground = k.add([
    k.rect(W, GROUND_HEIGHT),
    k.pos(0, GROUND_Y),
    k.color(...hexToRgb(GROUND_STOPS[0][1])),
    k.z(2),
  ])

  let nextDash = 0
  k.onUpdate(() => {
    k.setBackground(k.rgb(...sampleStops(SKY_STOPS, ctx.distance)))
    ground.color = k.rgb(...sampleStops(GROUND_STOPS, ctx.distance))

    const v = worldSpeed(ctx)
    if (v <= 0) return
    const dx = v * k.dt()
    ctx.distance += dx

    for (const obj of k.get('scrolling')) {
      obj.pos.x -= dx
      if (obj.pos.x < SCROLL_CULL_X) obj.destroy()
    }

    for (const strip of k.get('parallax')) {
      strip.pos.x -= dx * strip.factor
      if (strip.pos.x <= -strip.stripW) strip.pos.x += strip.stripW * 2
    }

    if (ctx.distance >= nextDash) {
      nextDash = ctx.distance + DASH_SPACING
      k.add([
        k.rect(10, 3),
        k.pos(W + 12, GROUND_Y + GROUND_HEIGHT * 0.45),
        k.color(...hexToRgb(COLORS.peachSoft)),
        k.opacity(0.5),
        k.z(3),
        'scrolling',
      ])
    }
  })
}
