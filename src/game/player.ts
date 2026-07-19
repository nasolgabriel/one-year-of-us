import type { GameObj } from 'kaplay'
import { COLORS } from '@/lib/constants'
import { buildBasketSophie } from './art'
import { BOB, BUMP_TIME, HOP, PLAYER_X_FRAC } from './config'
import { GROUND_Y, hexToRgb } from './world'
import type { RideCtx } from './types'

export type Player = {
  obj: GameObj
  hop(): void
  bump(): void
  grounded(): boolean
  setSophie(inBasket: boolean): void
}

// Bike + rider composed from primitives, side view facing right. Root is
// anchored at the ground contact point between the wheels so hop physics and
// ground snapping stay one number. Layout constants below are the drawing —
// tuning-worthy numbers stay in config.
export function setupPlayer(ctx: RideCtx): Player {
  const { k } = ctx
  const ink = hexToRgb(COLORS.locked)
  const inkSoft = hexToRgb(COLORS.lockedSoft)
  const shirt = hexToRgb(COLORS.accentAlt)
  const skin = hexToRgb(COLORS.peach)
  const basketC = hexToRgb(COLORS.amber)
  const basketDark = hexToRgb(COLORS.twilightDark)

  const x = Math.round(k.width() * PLAYER_X_FRAC)
  const root = k.add([k.pos(x, GROUND_Y), k.rotate(0), k.scale(1), k.z(10)])

  // Wheels — tire + rim static, spokes in a spinning subgroup.
  const spinners: GameObj[] = []
  for (const wx of [-11, 11]) {
    root.add([k.circle(7), k.pos(wx, -7), k.color(...ink)])
    root.add([k.circle(4.5), k.pos(wx, -7), k.color(...inkSoft)])
    const spin = root.add([k.pos(wx, -7), k.rotate(0)])
    spin.add([k.rect(1.2, 11), k.pos(-0.6, -5.5), k.color(...ink)])
    const cross = spin.add([k.pos(0, 0), k.rotate(90)])
    cross.add([k.rect(1.2, 11), k.pos(-0.6, -5.5), k.color(...ink)])
    root.add([k.circle(1.2), k.pos(wx, -7), k.color(...hexToRgb(COLORS.peachSoft))])
    spinners.push(spin)
  }

  // Frame, seat, fork, handlebar.
  root.add([k.rect(11, 2), k.pos(-11, -8.5), k.color(...ink)])
  root.add([k.circle(2), k.pos(0, -8), k.color(...inkSoft)])
  root.add([k.rect(2, 9), k.pos(-7, -17), k.color(...ink)])
  root.add([k.rect(15, 2), k.pos(-7, -18), k.color(...ink)])
  root.add([k.rect(2, 9), k.pos(10, -17), k.color(...ink)])
  root.add([k.rect(6, 2.5), k.pos(-10, -20.5), k.color(...ink)])
  root.add([k.rect(2, 5), k.pos(10, -22), k.color(...ink)])
  root.add([k.rect(4, 2), k.pos(8, -23.5), k.color(...ink)])

  // Basket on the front — Sophie's seat from Act 2 on.
  root.add([k.rect(9, 7), k.pos(13, -21), k.color(...basketC)])
  root.add([k.rect(9, 1), k.pos(13, -18.5), k.color(...basketDark), k.opacity(0.4)])
  root.add([k.rect(9, 1), k.pos(13, -16.5), k.color(...basketDark), k.opacity(0.4)])
  root.add([k.rect(10, 1.5), k.pos(12.5, -22), k.color(...basketDark)])

  // Rider — legs first (behind frame reads better), then torso, arm, head.
  const legs: GameObj[] = []
  for (let i = 0; i < 2; i++) {
    legs.push(root.add([k.rect(2.5, 8), k.pos(-7, -20), k.rotate(0), k.color(...ink)]))
  }
  root.add([k.rect(4.5, 11), k.pos(-3, -30), k.rotate(-22), k.color(...shirt)])
  root.add([k.rect(2, 12.5), k.pos(-2, -29), k.rotate(61), k.color(...shirt)])
  root.add([k.circle(3.7), k.pos(-2.2, -33.8), k.color(...ink)])
  root.add([k.circle(3.6), k.pos(-1.5, -33), k.color(...skin)])

  let vy = 0
  let grounded = true
  let bumpT = 0

  const land = () => {
    root.scale = k.vec2(1.06, 0.92)
    k.tween(0, 1, 0.18, (t) => {
      root.scale = k.vec2(1.06 + (1 - 1.06) * t, 0.92 + (1 - 0.92) * t)
    }, k.easings.easeOutQuad)
    for (let i = 0; i < 3; i++) {
      k.add([
        k.rect(2, 2),
        k.pos(root.pos.x + k.rand(-6, 6), GROUND_Y - 1),
        k.color(...hexToRgb(COLORS.peachSoft)),
        k.opacity(0.8),
        k.move(k.rand(200, 340), k.rand(18, 34)),
        k.lifespan(0.35, { fade: 0.3 }),
      ])
    }
  }

  root.onUpdate(() => {
    if (!grounded) {
      vy += HOP.gravity * k.dt()
      root.pos.y += vy * k.dt()
      if (root.pos.y >= GROUND_Y) {
        root.pos.y = GROUND_Y
        vy = 0
        grounded = true
        land()
      }
    } else if (ctx.phase === 'riding') {
      const bounce = (Math.sin(k.time() * BOB.freq) * 0.5 + 0.5) * BOB.amp
      root.pos.y = GROUND_Y - bounce
    }

    for (const spin of spinners) {
      spin.angle += ctx.speedScale * 520 * k.dt()
    }

    if (!grounded) {
      legs[0].angle = 34
      legs[1].angle = 22
    } else {
      const swing = Math.sin(k.time() * 7) * 26 * Math.max(ctx.speedScale, 0.15)
      legs[0].angle = 8 + swing
      legs[1].angle = 8 - swing
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

  // Sophie riding in the basket — created on pickup, kept for the ride.
  let basketSophie: GameObj | null = null
  const setSophie = (inBasket: boolean) => {
    if (inBasket && !basketSophie) {
      basketSophie = root.add([k.pos(17, -22), k.z(1)])
      buildBasketSophie(k, basketSophie)
    } else if (!inBasket && basketSophie) {
      basketSophie.destroy()
      basketSophie = null
    }
  }

  k.onMousePress(hop)
  k.onKeyPress('space', hop)

  return { obj: root, hop, bump, grounded: () => grounded, setSophie }
}
