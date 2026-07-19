import type { GameObj } from 'kaplay'
import { COLORS } from '@/lib/constants'
import {
  butterflyOps,
  emit,
  flowerPotOps,
  fenceOps,
  dogOps,
  heartHiOps,
  hoseOps,
  polaroidOps,
  puddleOps,
  yarnOps,
} from './sprites'
import { actAt, COLLECT_RADIUS, SPAWN, type Act } from './config'
import { GROUND_Y, hexToRgb } from './world'
import type { Player } from './player'
import type { CollectibleKind, ObstacleKind, RideCtx } from './types'

const rand = (min: number, max: number) => min + Math.random() * (max - min)

const PAPER = '#FFFDF7' // established polaroid-paper token (Album uses the same)

// Collision footprints, sized per the art-pass sprite sheet — gentle things
// only; a missed hop bumps, never fails.
const OBSTACLES: Record<ObstacleKind, { w: number; h: number }> = {
  flowerPot: { w: 10, h: 10 },
  puddle:    { w: 16, h: 3 },
  fence:     { w: 4,  h: 14 },
  dog:       { w: 15, h: 8 },
  hose:      { w: 18, h: 4 },
}

// Floating collectibles; y is the height band above the ground they hover in.
// Yarn is Sophie's — it only appears once she's in the basket (act 3).
// The butterfly is the rare bonus.
const COLLECTIBLES: Record<
  CollectibleKind,
  { tint: string; y: [number, number]; weight: number; act3Only?: boolean }
> = {
  heart:     { tint: COLORS.pinkDeep, y: [18, 46], weight: 6 },
  polaroid:  { tint: PAPER,           y: [24, 40], weight: 1 },
  yarn:      { tint: COLORS.mint,     y: [6, 12],  weight: 2, act3Only: true },
  butterfly: { tint: COLORS.pink,     y: [30, 52], weight: 1 },
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

  // Sprite looks — 1:1 art-pass pixels; obstacle roots sit at the ground
  // contact, collectible roots at the sprite centre.
  const OBSTACLE_ART: Record<ObstacleKind, (o: GameObj) => void> = {
    flowerPot: (o) => emit(k, o, flowerPotOps(), -5, -10),
    puddle:    (o) => emit(k, o, puddleOps(), -8, -3),
    fence:     (o) => emit(k, o, fenceOps(), -2, -14),
    dog:       (o) => emit(k, o, dogOps(), -7, -8),
    hose:      (o) => emit(k, o, hoseOps(), -9, -4),
  }

  const COLLECTIBLE_ART: Record<CollectibleKind, (c: GameObj) => void> = {
    heart:     (c) => emit(k, c, heartHiOps(COLORS.pinkDeep, COLORS.pink), -3.5, -3.5),
    polaroid:  (c) => emit(k, c, polaroidOps(), -4, -5),
    yarn:      (c) => emit(k, c, yarnOps(), -4, -4),
    butterfly: (c) => emit(k, c, butterflyOps(), -3.5, -2),
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
