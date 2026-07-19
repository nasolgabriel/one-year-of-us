import type { GameObj } from 'kaplay'
import { COLORS } from '@/lib/constants'
import { buildPixelHeart, buildSittingSophie } from './art'
import { SOPHIE, TIMELINE } from './config'
import { GROUND_Y } from './world'
import type { Player } from './player'
import type { RideCtx } from './types'

// Phase writes stay in createRideGame — these closures are defined there.
export type PickupCallbacks = {
  onSequenceStart(): void
  onSequenceEnd(): void
}

// The wordless Act 2 beat: Sophie sits on the path, the bike brakes, she
// tail-swishes, arcs into the basket with a floating heart, and the ride
// resumes. No card, no words — the action is the moment.
export function setupSophiePickup(ctx: RideCtx, player: Player, callbacks: PickupCallbacks) {
  const { k } = ctx

  let sophie: GameObj | null = null
  let tail: GameObj | null = null
  let spawned = false
  let done = false

  const spawnSittingSophie = () => {
    const s = k.add([k.pos(k.width() + 20, GROUND_Y), k.z(9), 'scrolling'])
    tail = buildSittingSophie(k, s).tail
    return s
  }

  const runSequence = () => {
    done = true
    callbacks.onSequenceStart()
    const s = sophie!
    s.untag('scrolling')

    for (const o of k.get('obstacle')) {
      k.tween(o.opacity, 0, 0.4, (v) => (o.opacity = v)).onEnd(() => o.destroy())
    }

    k.tween(ctx.speedScale, 0, SOPHIE.stopTime, (v) => (ctx.speedScale = v), k.easings.easeOutQuad).onEnd(
      () => {
        const swish = k.tween(0, Math.PI * 4, SOPHIE.swishTime, (t) => {
          if (tail) tail.pos.y = -3 - Math.abs(Math.sin(t)) * 3
        })
        swish.onEnd(() => {
          const sx = s.pos.x
          const sy = s.pos.y
          k.tween(0, 1, SOPHIE.arcTime, (t) => {
            const tx = player.obj.pos.x + 14
            const ty = player.obj.pos.y - 22
            s.pos.x = sx + (tx - sx) * t
            s.pos.y = sy + (ty - sy) * t - Math.sin(t * Math.PI) * 26
          }).onEnd(() => {
            s.destroy()
            sophie = null
            player.setSophie(true)
            const heart = k.add([
              k.pos(player.obj.pos.x + 17, player.obj.pos.y - 36),
              k.opacity(1),
              k.move(270, 24),
              k.lifespan(0.9, { fade: 0.7 }),
              k.z(11),
            ])
            buildPixelHeart(k, heart, 1, COLORS.pinkDeep)
            ctx.events.onSophiePickup()
            k.wait(SOPHIE.restartDelay, () => {
              callbacks.onSequenceEnd()
              k.tween(ctx.speedScale, 1, 0.8, (v) => (ctx.speedScale = v), k.easings.easeInOutQuad)
            })
          })
        })
      },
    )
  }

  k.onUpdate(() => {
    if (done) return
    if (!spawned && ctx.phase === 'riding' && ctx.distance >= TIMELINE.sophiePickup - SOPHIE.lead) {
      spawned = true
      sophie = spawnSittingSophie()
    }
    if (sophie && ctx.phase === 'riding' && sophie.pos.x <= k.width() * SOPHIE.stopX) {
      runSequence()
    }
  })
}
