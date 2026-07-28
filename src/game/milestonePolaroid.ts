import type { GameObj } from 'kaplay'
import { COLORS } from '@/lib/constants'
import { emit, polaroidOps, sparkleOps } from './sprites'
import { COLLECT_RADIUS, PLAYER_X_FRAC } from './config'
import { GROUND_Y, spawnBurst } from './world'
import type { Player } from './player'
import type { MilestoneDef, RideCtx } from './types'

const PAPER = '#FFFDF7' // established polaroid-paper token (Album uses the same)

export type MilestonePolaroids = {
  // setDistance jumps: kill any onscreen polaroid, re-arm from the new spot.
  sync(d: number): void
}

// Milestone polaroids — the memory trigger. One drifts in ahead of each
// checkpoint so it reaches the rider at the milestone's exact distance, at
// handlebar height where the pickup magnet always catches it. Catching it is
// what slows the world into memory mode; the memory is a story beat, not a
// skill check, so a can't-miss fallback fires once it passes the rider.
export function setupMilestonePolaroid(
  ctx: RideCtx,
  player: Player,
  milestones: MilestoneDef[],
  onCatch: (def: MilestoneDef) => void,
): MilestonePolaroids {
  const { k } = ctx

  // Road between the right-edge spawn point and the rider.
  const lead = k.width() + 20 - k.width() * PLAYER_X_FRAC

  let next = 0
  let active: GameObj | null = null
  let activeDef: MilestoneDef | null = null

  const spawn = (def: MilestoneDef) => {
    const baseY = GROUND_Y - 26
    const c = k.add([
      k.pos(k.width() + 20, baseY),
      k.z(4),
      'scrolling',
      { baseY, seed: Math.random() * Math.PI * 2 },
    ])
    emit(k, c, polaroidOps(), -4, -5)
    emit(k, c, sparkleOps(COLORS.peachSoft, 0.9), 5, -8)
    active = c
    activeDef = def
  }

  k.onUpdate(() => {
    if (active && !active.exists()) {
      active = null
      activeDef = null
    }
    if (ctx.phase !== 'riding') return

    if (!active && next < milestones.length && ctx.distance >= milestones[next].distance - lead) {
      spawn(milestones[next])
      next++
    }
    if (!active) return

    active.pos.y = active.baseY + Math.sin(k.time() * 3 + active.seed) * 2

    const px = player.obj.pos.x
    const py = player.obj.pos.y - 18
    const dx = active.pos.x - px
    const dy = active.pos.y - py
    const magnet = COLLECT_RADIUS + 4
    if (dx * dx + dy * dy < magnet * magnet || active.pos.x <= px - 6) {
      spawnBurst(k, active.pos.x, active.pos.y, PAPER)
      ctx.events.onCollect('polaroid')
      const def = activeDef!
      active.destroy()
      active = null
      activeDef = null
      onCatch(def)
    }
  })

  return {
    sync(d) {
      active?.destroy()
      active = null
      activeDef = null
      const idx = milestones.findIndex((def) => def.distance > d)
      next = idx === -1 ? milestones.length : idx
    },
  }
}
