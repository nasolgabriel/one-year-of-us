import { COLORS } from '@/lib/constants'
import {
  DASH_SPACING,
  GROUND_COLOR,
  GROUND_HEIGHT,
  RIDE_SPEED,
  SCROLL_CULL_X,
  VIRTUAL_HEIGHT,
} from './config'
import type { RideCtx } from './types'

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const GROUND_Y = VIRTUAL_HEIGHT - GROUND_HEIGHT

export function worldSpeed(ctx: RideCtx): number {
  return RIDE_SPEED * ctx.speedScale
}

// Ground strip + scroll driver. Everything tagged 'scrolling' is moved left at
// world speed and culled off the left edge; ctx.distance is the master clock
// every other module keys off.
export function setupWorld(ctx: RideCtx) {
  const { k } = ctx

  k.add([
    k.rect(k.width(), GROUND_HEIGHT),
    k.pos(0, GROUND_Y),
    k.color(...hexToRgb(GROUND_COLOR)),
  ])

  let nextDash = 0
  k.onUpdate(() => {
    const v = worldSpeed(ctx)
    if (v <= 0) return
    const dx = v * k.dt()
    ctx.distance += dx

    for (const obj of k.get('scrolling')) {
      obj.pos.x -= dx
      if (obj.pos.x < SCROLL_CULL_X) obj.destroy()
    }

    if (ctx.distance >= nextDash) {
      nextDash = ctx.distance + DASH_SPACING
      k.add([
        k.rect(10, 3),
        k.pos(k.width() + 12, GROUND_Y + GROUND_HEIGHT * 0.45),
        k.color(...hexToRgb(COLORS.peachSoft)),
        k.opacity(0.5),
        'scrolling',
      ])
    }
  })
}
