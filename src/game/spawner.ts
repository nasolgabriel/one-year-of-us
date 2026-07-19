import type { GameObj } from 'kaplay'
import { COLORS } from '@/lib/constants'
import { buildPixelHeart } from './art'
import { actAt, COLLECT_RADIUS, SPAWN, type Act } from './config'
import { GROUND_Y, hexToRgb } from './world'
import type { Player } from './player'
import type { CollectibleKind, ObstacleKind, RideCtx } from './types'

const rand = (min: number, max: number) => min + Math.random() * (max - min)

const PAPER = '#FFFDF7' // established polaroid-paper token (Album uses the same)

// Collision footprints — gentle things only; a missed hop bumps, never fails.
const OBSTACLES: Record<ObstacleKind, { w: number; h: number }> = {
  flowerPot: { w: 12, h: 16 },
  puddle:    { w: 18, h: 3 },
  fence:     { w: 16, h: 13 },
  dog:       { w: 16, h: 9 },
  hose:      { w: 14, h: 8 },
}

// Floating collectibles; y is the height band above the ground they hover in.
// Yarn is Sophie's — it only appears once she's in the basket (act 3).
const COLLECTIBLES: Record<
  Exclude<CollectibleKind, 'butterfly'>,
  { tint: string; y: [number, number]; weight: number; act3Only?: boolean }
> = {
  heart:    { tint: COLORS.pinkDeep, y: [18, 46], weight: 6 },
  polaroid: { tint: PAPER,           y: [24, 40], weight: 1 },
  yarn:     { tint: COLORS.mint,     y: [6, 12],  weight: 2, act3Only: true },
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
  const ink = hexToRgb(COLORS.locked)
  const rose = hexToRgb(COLORS.rose)
  const pinkDeep = hexToRgb(COLORS.pinkDeep)
  const mintDark = hexToRgb(COLORS.mintDark)
  const twilight = hexToRgb(COLORS.twilight)
  const twilightDark = hexToRgb(COLORS.twilightDark)

  // Obstacle looks — each drawn onto a root whose origin is the ground contact.
  const OBSTACLE_ART: Record<ObstacleKind, (o: GameObj) => void> = {
    flowerPot: (o) => {
      o.add([
        k.polygon([k.vec2(-4, 0), k.vec2(4, 0), k.vec2(6, -9), k.vec2(-6, -9)]),
        k.pos(0, 0), k.color(...rose), k.opacity(1),
      ])
      o.add([k.rect(12, 2), k.pos(-6, -11), k.color(...pinkDeep), k.opacity(1)])
      o.add([k.rect(1.2, 5), k.pos(-0.6, -16), k.color(...mintDark), k.opacity(1)])
      for (const [px, py] of [[-3, -18.5], [1, -18.5], [-1, -20.5], [-1, -16.5]]) {
        o.add([k.rect(2, 2), k.pos(px, py), k.color(...pinkDeep), k.opacity(1)])
      }
      o.add([k.circle(1.2), k.pos(0, -17.5), k.color(...hexToRgb(COLORS.peach)), k.opacity(1)])
    },
    puddle: (o) => {
      o.add([k.circle(8), k.scale(1.15, 0.32), k.pos(0, -1.2), k.color(...hexToRgb(COLORS.lockedSoft)), k.opacity(0.75)])
      o.add([k.circle(3), k.scale(1.3, 0.3), k.pos(-2, -1.5), k.color(...hexToRgb(COLORS.peachSoft)), k.opacity(0.3)])
    },
    fence: (o) => {
      for (const px of [-8, -1.5, 5]) {
        o.add([k.rect(2.5, 12), k.pos(px, -12), k.color(...ink), k.opacity(1)])
      }
      o.add([k.rect(16, 2), k.pos(-8, -9), k.color(...ink), k.opacity(1)])
    },
    dog: (o) => {
      o.add([k.rect(5, 1.5), k.pos(-9.5, -5), k.rotate(-25), k.color(...twilight), k.opacity(1)])
      o.add([k.circle(5), k.scale(1.6, 0.85), k.pos(-1, -4), k.color(...twilight), k.opacity(1)])
      o.add([k.circle(3.5), k.pos(6, -4.5), k.color(...twilight), k.opacity(1)])
      o.add([k.rect(2.5, 3), k.pos(6.5, -8), k.rotate(20), k.color(...twilightDark), k.opacity(1)])
      o.add([k.rect(1.5, 0.8), k.pos(6.6, -5.4), k.color(...ink), k.opacity(1)])
      o.add([k.rect(1, 1), k.pos(9, -4.6), k.color(...ink), k.opacity(1)])
    },
    hose: (o) => {
      for (const py of [-2, -4.2, -6.4]) {
        o.add([k.circle(5), k.scale(1.4, 0.5), k.pos(0, py), k.color(...mintDark), k.opacity(1)])
      }
      o.add([k.rect(4, 1.5), k.pos(5, -7.5), k.color(...mintDark), k.opacity(1)])
    },
  }

  const COLLECTIBLE_ART: Record<keyof typeof COLLECTIBLES, (c: GameObj) => void> = {
    heart: (c) => buildPixelHeart(k, c, 1.3, COLORS.pinkDeep),
    polaroid: (c) => {
      c.add([k.rect(9, 11), k.pos(-4.5, -5.5), k.color(...hexToRgb(PAPER)), k.opacity(1)])
      c.add([k.rect(7, 6), k.pos(-3.5, -4.5), k.color(...hexToRgb(COLORS.purpleSoft)), k.opacity(1)])
    },
    yarn: (c) => {
      c.add([k.circle(4.5), k.pos(0, 0), k.color(...hexToRgb(COLORS.mint)), k.opacity(1)])
      c.add([k.rect(8, 1), k.pos(-4, -1.8), k.rotate(18), k.color(...mintDark), k.opacity(1)])
      c.add([k.rect(8, 1), k.pos(-3.6, 1), k.rotate(-14), k.color(...mintDark), k.opacity(1)])
      c.add([k.rect(4.5, 1), k.pos(2.5, 3.6), k.color(...mintDark), k.opacity(1)])
    },
  }

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
    const o = k.add([
      k.pos(k.width() + 20, GROUND_Y),
      k.opacity(1),
      k.z(4),
      'scrolling',
      'obstacle',
      { halfW: spec.w / 2, hit: false },
    ])
    OBSTACLE_ART[kind](o)
  }

  const spawnCollectible = () => {
    const kind = pickCollectible(actAt(ctx.distance))
    const spec = COLLECTIBLES[kind]
    const baseY = GROUND_Y - rand(...spec.y)
    const c = k.add([
      k.pos(k.width() + 20, baseY),
      k.z(4),
      'scrolling',
      'collectible',
      { kind, tint: spec.tint, baseY, seed: rand(0, Math.PI * 2) },
    ])
    COLLECTIBLE_ART[kind](c)
  }

  let nextObstacle = 260
  let nextCollectible = 120

  k.onUpdate(() => {
    // Collectibles keep their gentle float even during memory/pickup beats.
    for (const c of k.get('collectible')) {
      c.pos.y = c.baseY + Math.sin(k.time() * 3 + c.seed) * 2
    }

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
