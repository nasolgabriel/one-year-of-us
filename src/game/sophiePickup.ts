import type { GameObj, TimerController } from 'kaplay'
import { COLORS } from '@/lib/constants'
import {
  emit,
  heartOps,
  hexToRgb,
  sophieBasketHeadOps,
  sophieRoadsideOps,
  sophieSittingOps,
  zGlyphOps,
} from './sprites'
import { S } from './sprites'
import { SOPHIE } from './config'
import { GROUND_Y } from './world'
import type { Player } from './player'
import type { RideCtx } from './types'

// Phase writes stay in createRideGame — these closures are defined there.
export type PickupCallbacks = {
  onSequenceStart(): void
  onSequenceEnd(): void
}

// The wordless Act 2 beat: Sophie is curled asleep at the roadside with z's
// rising (art-pass 15×10 sprite), the bike brakes, she wakes and sits up,
// tail-swishes, then arcs into the basket with a floating heart and the ride
// resumes. No card, no words — the action is the moment.
export function setupSophiePickup(ctx: RideCtx, player: Player, callbacks: PickupCallbacks) {
  const { k } = ctx

  let sophie: GameObj | null = null
  let sleepPose: GameObj | null = null
  let sitPose: GameObj | null = null
  let tail: GameObj | null = null
  let zLoop: TimerController | null = null
  let spawned = false
  let done = false

  const spawnSleepingSophie = () => {
    const s = k.add([k.pos(k.width() + 20, GROUND_Y), k.z(9), 'scrolling'])
    sleepPose = s.add([k.pos(0, 0)])
    emit(k, sleepPose, sophieRoadsideOps(), -7, -10)

    // Awake sitting pose, hidden until the wake beat: chest + basket head +
    // a swishable tail.
    sitPose = s.add([k.pos(0, 0)])
    emit(k, sitPose, sophieSittingOps())
    emit(k, sitPose, sophieBasketHeadOps(), -3.5, -13)
    tail = sitPose.add([k.rect(5, 2), k.pos(3, -3), k.color(...hexToRgb(S.g)), k.opacity(1)])
    sitPose.hidden = true

    // Rising z's — children of the root so they scroll with her (art pass
    // stacks them up and to the right).
    zLoop = k.loop(1.1, () => {
      const z = s.add([k.pos(9, -12), k.opacity(0.7)])
      emit(k, z, zGlyphOps())
      z.onUpdate(() => {
        z.pos.y -= 7 * k.dt()
        z.pos.x += 2.5 * k.dt()
        z.opacity -= 0.45 * k.dt()
        if (z.opacity <= 0) z.destroy()
      })
    })
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
        // She wakes — z's stop, the curled pose sits up.
        zLoop?.cancel()
        zLoop = null
        if (sleepPose) sleepPose.hidden = true
        if (sitPose) sitPose.hidden = false
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
            emit(k, heart, heartOps(COLORS.pinkDeep), -3.5, -3.5)
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
    if (!spawned && ctx.phase === 'riding' && ctx.distance >= ctx.timeline.pickup - SOPHIE.lead) {
      spawned = true
      sophie = spawnSleepingSophie()
    }
    if (sophie && ctx.phase === 'riding' && sophie.pos.x <= k.width() * SOPHIE.stopX) {
      runSequence()
    }
  })
}
