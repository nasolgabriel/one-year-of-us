import type { GameObj } from 'kaplay'
import { COLORS } from '@/lib/constants'
import { BOB, BUMP_TIME, HOP, PLAYER_X_FRAC } from './config'
import { GROUND_Y, hexToRgb } from './world'
import type { RideCtx } from './types'

export type Player = {
  obj: GameObj
  hop(): void
  bump(): void
  grounded(): boolean
}

// Graybox bike + rider. Root is anchored at the bottom-center contact point so
// hop physics and ground snapping stay one number. Real sprites replace the
// child shapes in the art pass without touching the physics.
export function setupPlayer(ctx: RideCtx): Player {
  const { k } = ctx
  const ink = hexToRgb(COLORS.locked)
  const x = Math.round(k.width() * PLAYER_X_FRAC)

  const root = k.add([k.pos(x, GROUND_Y), k.rotate(0), k.z(10)])

  root.add([k.circle(6), k.pos(-10, -6), k.color(...ink)])
  root.add([k.circle(6), k.pos(10, -6), k.color(...ink)])
  root.add([k.rect(26, 4), k.pos(-13, -12), k.color(...ink)])
  root.add([k.rect(8, 12), k.pos(-4, -26), k.color(...ink)])
  root.add([k.rect(8, 8), k.pos(-4, -34), k.color(...ink)])
  root.add([k.rect(10, 7), k.pos(9, -19), k.color(...hexToRgb(COLORS.amber))])

  let vy = 0
  let grounded = true
  let bumpT = 0

  root.onUpdate(() => {
    if (!grounded) {
      vy += HOP.gravity * k.dt()
      root.pos.y += vy * k.dt()
      if (root.pos.y >= GROUND_Y) {
        root.pos.y = GROUND_Y
        vy = 0
        grounded = true
      }
    } else if (ctx.phase === 'riding') {
      const bounce = (Math.sin(k.time() * BOB.freq) * 0.5 + 0.5) * BOB.amp
      root.pos.y = GROUND_Y - bounce
    }

    if (bumpT > 0) {
      bumpT = Math.max(0, bumpT - k.dt())
      root.angle = Math.sin(bumpT * 40) * 8 * (bumpT / BUMP_TIME)
    } else if (root.angle !== 0) {
      root.angle = 0
    }
  })

  const hop = () => {
    if (ctx.phase !== 'riding' || !grounded) return
    grounded = false
    vy = HOP.velocity
  }

  const bump = () => {
    if (bumpT <= 0) bumpT = BUMP_TIME
  }

  k.onMousePress(hop)
  k.onKeyPress('space', hop)

  return { obj: root, hop, bump, grounded: () => grounded }
}
