import { COLORS } from '@/lib/constants'
import { actAt, COLLECT_RADIUS, SPAWN, type Act } from './config'
import { GROUND_Y, hexToRgb } from './world'
import type { Player } from './player'
import type { CollectibleKind, ObstacleKind, RideCtx } from './types'

const rand = (min: number, max: number) => min + Math.random() * (max - min)

// Graybox obstacle footprints — gentle things only; a missed hop bumps, never fails.
const OBSTACLES: Record<ObstacleKind, { w: number; h: number; color: string }> = {
  flowerPot: { w: 10, h: 10, color: COLORS.rose },
  puddle:    { w: 16, h: 3,  color: COLORS.lockedSoft },
  fence:     { w: 4,  h: 14, color: COLORS.locked },
  dog:       { w: 14, h: 8,  color: COLORS.twilight },
  hose:      { w: 18, h: 4,  color: COLORS.mintDark },
}

// Floating collectibles; y is the height band above the ground they hover in.
// Yarn is Sophie's — it only appears once she's in the basket (act 3).
const COLLECTIBLES: Record<
  Exclude<CollectibleKind, 'butterfly'>,
  { w: number; h: number; color: string; y: [number, number]; weight: number; act3Only?: boolean }
> = {
  heart:    { w: 6, h: 6,  color: COLORS.pinkDeep,  y: [18, 46], weight: 6 },
  polaroid: { w: 8, h: 10, color: COLORS.peachSoft, y: [24, 40], weight: 1 },
  yarn:     { w: 8, h: 8,  color: COLORS.mint,      y: [6, 10],  weight: 2, act3Only: true },
}

function pickCollectible(act: Act): keyof typeof COLLECTIBLES {
  const entries = Object.entries(COLLECTIBLES).filter(([, spec]) => !(spec.act3Only && act === 1))
  const total = entries.reduce((sum, [, spec]) => sum + spec.weight, 0)
  let roll = Math.random() * total
  for (const [kind, spec] of entries) {
    roll -= spec.weight
    if (roll <= 0) return kind as keyof typeof COLLECTIBLES
  }
  return 'heart'
}

export function setupSpawner(ctx: RideCtx, player: Player) {
  const { k } = ctx

  const burst = (x: number, y: number, color: string) => {
    for (const angle of [45, 135, 225, 315]) {
      k.add([
        k.rect(2, 2),
        k.pos(x, y),
        k.color(...hexToRgb(color)),
        k.opacity(1),
        k.move(angle, 46),
        k.lifespan(0.35, { fade: 0.3 }),
      ])
    }
  }

  const spawnObstacle = () => {
    const kinds = Object.keys(OBSTACLES) as ObstacleKind[]
    const kind = kinds[Math.floor(Math.random() * kinds.length)]
    const spec = OBSTACLES[kind]
    k.add([
      k.rect(spec.w, spec.h),
      k.pos(k.width() + 20, GROUND_Y - spec.h),
      k.color(...hexToRgb(spec.color)),
      'scrolling',
      'obstacle',
      { halfW: spec.w / 2, hit: false },
    ])
  }

  const spawnCollectible = () => {
    const kind = pickCollectible(actAt(ctx.distance))
    const spec = COLLECTIBLES[kind]
    k.add([
      k.rect(spec.w, spec.h),
      k.pos(k.width() + 20, GROUND_Y - rand(...spec.y) - spec.h),
      k.color(...hexToRgb(spec.color)),
      'scrolling',
      'collectible',
      { kind, tint: spec.color },
    ])
  }

  let nextObstacle = 260
  let nextCollectible = 120

  k.onUpdate(() => {
    if (ctx.phase !== 'riding') return

    if (ctx.distance >= nextObstacle) {
      nextObstacle = ctx.distance + rand(...SPAWN.obstacleGap)
      spawnObstacle()
    }
    if (ctx.distance >= nextCollectible) {
      nextCollectible = ctx.distance + rand(...SPAWN.collectibleGap)
      spawnCollectible()
    }

    const px = player.obj.pos.x
    // Rider "chest" point the pickup magnet is centered on.
    const py = player.obj.pos.y - 18

    for (const o of k.get('obstacle')) {
      if (!o.hit && player.grounded() && Math.abs(o.pos.x - px) < o.halfW + 12) {
        o.hit = true
        player.bump()
      }
    }

    for (const c of k.get('collectible')) {
      const dx = c.pos.x - px
      const dy = c.pos.y - py
      if (dx * dx + dy * dy < COLLECT_RADIUS * COLLECT_RADIUS) {
        burst(c.pos.x, c.pos.y, c.tint)
        ctx.events.onCollect(c.kind)
        c.destroy()
      }
    }
  })
}
