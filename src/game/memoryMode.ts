import type { TimerController } from 'kaplay'
import { COLORS } from '@/lib/constants'
import { MEMORY } from './config'
import { hexToRgb, spawnPetal } from './world'
import type { RideCtx } from './types'

export type MemoryMode = {
  enter(onSettled: () => void): void
  exit(): void
}

// The slowdown/speedup sequence around a milestone. Phase transitions stay in
// createRideGame — this module only moves the world: speed tween, warm wash
// overlay, obstacle fade-out.
export function setupMemoryMode(ctx: RideCtx): MemoryMode {
  const { k } = ctx

  const overlay = k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(...hexToRgb(COLORS.peach)),
    k.opacity(0),
    k.z(50),
  ])

  let petalLoop: TimerController | null = null

  return {
    enter(onSettled) {
      petalLoop = k.loop(0.5, () => spawnPetal(k, Math.random() * k.width(), -6))
      k.tween(
        ctx.speedScale,
        MEMORY.slowScale,
        MEMORY.slowdown,
        (v) => (ctx.speedScale = v),
        k.easings.easeOutQuad,
      ).onEnd(onSettled)
      k.tween(overlay.opacity, MEMORY.overlayOpacity, MEMORY.slowdown, (v) => (overlay.opacity = v))
      for (const o of k.get('obstacle')) {
        k.tween(o.opacity, 0, MEMORY.slowdown * 0.6, (v) => (o.opacity = v)).onEnd(() => o.destroy())
      }
    },
    exit() {
      petalLoop?.cancel()
      petalLoop = null
      k.tween(
        ctx.speedScale,
        1,
        MEMORY.speedup,
        (v) => (ctx.speedScale = v),
        k.easings.easeInOutQuad,
      )
      k.tween(overlay.opacity, 0, MEMORY.speedup, (v) => (overlay.opacity = v))
    },
  }
}
