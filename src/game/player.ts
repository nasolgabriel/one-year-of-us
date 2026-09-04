import type { GameObj } from 'kaplay'
import { COLORS } from '@/lib/constants'
import {
  emit,
  hexToRgb,
  motionFxOps,
  RIDER_B,
  riderBodyOps,
  riderLegsOps,
  sophieBasketHeadOps,
  spokeOps,
} from './sprites'
import { BOB, BUMP_TIME, HIT, HIT_TINT, HOP, PLAYER_X_FRAC } from './config'
import { sfxHop } from './audio'
import { GROUND_Y } from './world'
import type { RideCtx } from './types'

export type Player = {
  obj: GameObj
  hop(): void
  bump(): void
  grounded(): boolean
  canBeHit(): boolean
  setSophie(inBasket: boolean): void
}

function collectTinted(obj: GameObj, out: GameObj[]) {
  for (const c of obj.children as GameObj[]) {
    if (c.color) out.push(c)
    if (c.children.length) collectTinted(c, out)
  }
}

// The art-pass rider, 40×36 virtual px, pixel-composed 1:1 from
// ride-sprites.js — variant B "mint step-through". Root is anchored at the
// ground contact point between the wheels (sprite (20, 36)) so hop physics
// and ground snapping stay one number.
const OX = -20
const OY = -36

// Wheel hubs in sprite space — spin groups rotate around these.
const HUBS: [number, number][] = [[10, 29], [30, 29]]

// One full pedal cycle = two pose swaps; seconds per swap at full pace.
const PEDAL_STEP = 0.22

export function setupPlayer(ctx: RideCtx): Player {
  const { k } = ctx

  const x = Math.round(k.width() * PLAYER_X_FRAC)
  const root = k.add([k.pos(x, GROUND_Y), k.rotate(0), k.scale(1), k.z(10)])

  // Legs render under the frame, so they're added first.
  const legPoses: GameObj[] = [0 as const, 1 as const].map((pose) => {
    const g = root.add([k.pos(0, 0)])
    emit(k, g, riderLegsOps(RIDER_B, pose), OX, OY)
    return g
  })
  legPoses[1].hidden = true

  emit(k, root, riderBodyOps(RIDER_B), OX, OY)

  const spinners: GameObj[] = HUBS.map(([hx, hy]) => {
    const spin = root.add([k.pos(OX + hx, OY + hy), k.rotate(0)])
    emit(k, spin, spokeOps())
    return spin
  })

  // Speed dashes + dust behind the bike — screen-fixed, fade with world pace.
  const fx = k.add([k.pos(x, GROUND_Y), k.z(9)])
  emit(k, fx, motionFxOps())
  const fxBase = fx.children.map((c: GameObj) => c.opacity as number)

  let vy = 0
  let grounded = true
  let bumpT = 0
  let pedalT = 0
  let blinkT = 0
  let invulnT = 0
  let tinted: GameObj[] = []
  let baseColors: [number, number, number][] = []

  const HIT_RGB = hexToRgb(HIT_TINT)

  const clearTint = () => {
    tinted.forEach((o, i) => {
      if (!o.exists()) return
      const [r, g, b] = baseColors[i]
      o.color = k.rgb(r, g, b)
    })
    tinted = []
    baseColors = []
  }

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

    fx.children.forEach((c: GameObj, i: number) => {
      c.opacity = fxBase[i] * ctx.speedScale
    })

    // Pixel pedalling — alternate the two leg poses with the world pace;
    // airborne holds pose A.
    if (grounded) pedalT += Math.max(ctx.speedScale, 0.15) * k.dt()
    const pose = grounded ? Math.floor(pedalT / PEDAL_STEP) % 2 : 0
    legPoses[0].hidden = pose !== 0
    legPoses[1].hidden = pose !== 1

    if (bumpT > 0) {
      bumpT = Math.max(0, bumpT - k.dt())
      root.angle = Math.sin(bumpT * 40) * 8 * (bumpT / BUMP_TIME)
    } else if (root.angle !== 0) {
      root.angle = 0
    }

    if (invulnT > 0) invulnT = Math.max(0, invulnT - k.dt())

    if (blinkT > 0) {
      blinkT = Math.max(0, blinkT - k.dt())
      if (blinkT === 0) {
        clearTint()
      } else {
        const t = blinkT / HIT.blink
        const mix = Math.abs(Math.sin(t * Math.PI * HIT.blinkPulses)) * t * HIT.blinkMix
        tinted.forEach((o, i) => {
          if (!o.exists()) return
          const [r, g, b] = baseColors[i]
          o.color = k.rgb(
            r + (HIT_RGB[0] - r) * mix,
            g + (HIT_RGB[1] - g) * mix,
            b + (HIT_RGB[2] - b) * mix,
          )
        })
      }
    }
  })

  const hop = () => {
    if (ctx.phase !== 'riding' || !grounded) return
    grounded = false
    vy = HOP.velocity
    sfxHop()
  }

  const bump = () => {
    if (bumpT <= 0) bumpT = BUMP_TIME
    if (blinkT <= 0) {
      tinted = []
      collectTinted(root, tinted)
      baseColors = tinted.map((o) => [o.color.r, o.color.g, o.color.b])
    }
    blinkT = HIT.blink
    invulnT = HIT.invuln
  }

  // Sophie riding in the basket — created on pickup, kept for the ride.
  let basketSophie: GameObj | null = null
  const setSophie = (inBasket: boolean) => {
    if (inBasket && !basketSophie) {
      basketSophie = root.add([k.pos(0, 0), k.z(1)])
      emit(k, basketSophie, sophieBasketHeadOps(), OX + 31, OY + 6)
    } else if (!inBasket && basketSophie) {
      basketSophie.destroy()
      basketSophie = null
    }
  }

  k.onMousePress(hop)
  k.onKeyPress('space', hop)

  return {
    obj: root,
    hop,
    bump,
    grounded: () => grounded,
    canBeHit: () => invulnT <= 0,
    setSophie,
  }
}
