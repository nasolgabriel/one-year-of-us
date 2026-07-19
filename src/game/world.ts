import type { KAPLAYCtx } from 'kaplay'
import { COLORS } from '@/lib/constants'
import {
  actAt,
  DASH_SPACING,
  DECOR,
  GROUND_HEIGHT,
  GROUND_STOPS,
  RIDE_SPEED,
  SCROLL_CULL_X,
  SKY_STOPS,
  TIMELINE,
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const GROUND_Y = VIRTUAL_HEIGHT - GROUND_HEIGHT

const PETAL_TINTS = [COLORS.pink, COLORS.pinkDeep, COLORS.peach]

// Ambient petal — world's update loop drives every object tagged 'petal'
// (fall + sway + spin), so memory mode can rain its own through the same path.
export function spawnPetal(k: KAPLAYCtx, x: number, y: number) {
  k.add([
    k.rect(3, 3),
    k.pos(x, y),
    k.rotate(Math.random() * 90),
    k.color(...hexToRgb(PETAL_TINTS[Math.floor(Math.random() * PETAL_TINTS.length)])),
    k.opacity(0.85),
    k.z(5),
    'petal',
    { vy: 10 + Math.random() * 8, seed: Math.random() * Math.PI * 2 },
  ])
}

export function worldSpeed(ctx: RideCtx): number {
  return RIDE_SPEED * ctx.speedScale
}

// Ground strip, sun, clouds, parallax hills, ambient petals, and the scroll
// driver. Everything tagged 'scrolling' moves left at world speed and is
// culled off the left edge; 'parallax' strips move at a fraction of it and
// wrap. ctx.distance is the master clock every other module keys off.
// z-order: sun/clouds/hills 0 · bushes 1 · ground 2 · dashes/tufts 3 ·
// gameplay 4+ · player 10.
export function setupWorld(ctx: RideCtx) {
  const { k } = ctx
  const W = k.width()
  const H = k.height()

  // Sun — drifts lower, larger, and warmer as the ride approaches golden hour.
  const sun = k.add([k.pos(W * 0.8, H * 0.16), k.scale(1), k.z(0)])
  const sunGlow = sun.add([k.circle(24), k.pos(0, 0), k.color(...hexToRgb(COLORS.peach)), k.opacity(0.28)])
  const sunDisc = sun.add([k.circle(13), k.pos(0, 0), k.color(...hexToRgb(COLORS.peachSoft)), k.opacity(0.95)])

  // Two copies of each strip leapfrog to fake an infinite layer.
  const addStrip = (z: number, factor: number, build: (strip: ReturnType<typeof k.add>) => void) => {
    for (const offset of [0, W]) {
      const strip = k.add([k.pos(offset, 0), k.z(z), { factor, stripW: W }, 'parallax'])
      build(strip)
    }
  }

  const mintDark = hexToRgb(COLORS.mintDark)
  const cream = hexToRgb(COLORS.peachSoft)

  addStrip(0, 0.12, (strip) => {
    for (const [fx, fy] of [[0.22, 0.13], [0.68, 0.24]] as const) {
      const cx = W * fx
      const cy = H * fy
      strip.add([k.circle(7), k.pos(cx, cy), k.color(...cream), k.opacity(0.5)])
      strip.add([k.circle(5), k.pos(cx + 6, cy + 2), k.color(...cream), k.opacity(0.5)])
      strip.add([k.circle(5), k.pos(cx - 6, cy + 2), k.color(...cream), k.opacity(0.5)])
    }
  })

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
  k.add([k.rect(W, 2.5), k.pos(0, GROUND_Y), k.color(...mintDark), k.opacity(0.45), k.z(2)])

  const spawnTuft = (x: number) => {
    const tuft = k.add([k.pos(x, GROUND_Y), k.z(3), 'scrolling'])
    for (const [ox, apex, len] of [[-2.5, -4.5, 5], [0, 0.5, 7], [2.5, 5.5, 5]] as const) {
      tuft.add([
        k.polygon([k.vec2(ox, 0), k.vec2(ox + 1.4, 0), k.vec2(apex, -len)]),
        k.pos(0, 0),
        k.color(...mintDark),
        k.opacity(0.8),
      ])
    }
  }


  let nextDash = 0
  let nextTuft = 0
  let petalTimer = 0

  k.onUpdate(() => {
    k.setBackground(k.rgb(...sampleStops(SKY_STOPS, ctx.distance)))
    ground.color = k.rgb(...sampleStops(GROUND_STOPS, ctx.distance))

    const t = Math.min(1, ctx.distance / TIMELINE.finish)
    sun.pos.x = W * lerp(0.8, 0.62, t)
    sun.pos.y = H * lerp(0.16, 0.3, t)
    const s = lerp(1, 1.3, t)
    sun.scale = k.vec2(s, s)
    sunDisc.color = k.rgb(...sampleStops([[0, COLORS.peachSoft], [1, COLORS.peach]], t))
    sunGlow.color = k.rgb(...sampleStops([[0, COLORS.peach], [1, COLORS.accentAlt]], t))

    // Petals fall in any phase — even mid-memory, in slow motion.
    for (const p of k.get('petal')) {
      p.pos.y += p.vy * k.dt()
      p.pos.x += Math.sin(k.time() * 2 + p.seed) * 10 * k.dt()
      p.angle += 40 * k.dt()
      if (p.pos.y > GROUND_Y - 2) p.destroy()
    }

    const v = worldSpeed(ctx)
    if (v <= 0) return
    const dx = v * k.dt()
    ctx.distance += dx

    for (const obj of k.get('scrolling')) {
      obj.pos.x -= dx
      if (obj.pos.x < SCROLL_CULL_X) obj.destroy()
    }
    for (const p of k.get('petal')) {
      p.pos.x -= dx * 0.5
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
        k.color(...cream),
        k.opacity(0.5),
        k.z(3),
        'scrolling',
      ])
    }
    if (ctx.distance >= nextTuft) {
      nextTuft = ctx.distance + DECOR.tuftSpacing * (0.6 + Math.random() * 0.8)
      spawnTuft(W + 12)
    }

    // Golden-hour petals drift through act 3.
    if (ctx.phase === 'riding' && actAt(ctx.distance) === 3) {
      petalTimer += k.dt()
      if (petalTimer >= DECOR.petalEvery) {
        petalTimer = 0
        spawnPetal(k, Math.random() * W, -6)
      }
    }
  })
}
