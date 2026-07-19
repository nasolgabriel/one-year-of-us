import kaplay from 'kaplay'
import { SKY_STOPS, TIMELINE, VIRTUAL_HEIGHT } from './config'
import { setupMemoryMode } from './memoryMode'
import { MILESTONES } from './milestones'
import { setupPlayer } from './player'
import { setupSpawner } from './spawner'
import { hexToRgb, setupWorld } from './world'
import type { GameEvents, GameHandle, RideCtx } from './types'

export function createRideGame(canvas: HTMLCanvasElement, events: GameEvents): GameHandle {
  const holder = canvas.parentElement
  const holderW = holder?.clientWidth || 375
  const holderH = holder?.clientHeight || 667
  const width = Math.round(VIRTUAL_HEIGHT * (holderW / holderH))

  const k = kaplay({
    canvas,
    width,
    height: VIRTUAL_HEIGHT,
    scale: holderH / VIRTUAL_HEIGHT,
    global: false,
    crisp: true,
    pixelDensity: 1,
    touchToMouse: true,
    background: hexToRgb(SKY_STOPS[0][1]),
  })

  const ctx: RideCtx = { k, events, phase: 'idle', distance: 0, speedScale: 0 }

  setupWorld(ctx)
  const player = setupPlayer(ctx)
  setupSpawner(ctx, player)
  const memory = setupMemoryMode(ctx)

  // Timeline supervisor — the only place `phase` is written outside the
  // handle. Watches the distance clock for story beats. Jumping the distance
  // backwards (dev harness) re-arms any milestones now ahead of the rider.
  let nextMilestone = 0
  k.onUpdate(() => {
    if (ctx.phase !== 'riding') return

    while (nextMilestone > 0 && ctx.distance < MILESTONES[nextMilestone - 1].distance) {
      nextMilestone--
    }

    if (nextMilestone < MILESTONES.length && ctx.distance >= MILESTONES[nextMilestone].distance) {
      const def = MILESTONES[nextMilestone]
      nextMilestone++
      ctx.phase = 'memory'
      memory.enter(() => events.onMilestone(def))
      return
    }

    if (ctx.distance >= TIMELINE.finish) {
      ctx.phase = 'finished'
      k.tween(ctx.speedScale, 0, 1.4, (v) => (ctx.speedScale = v), k.easings.easeOutQuad).onEnd(
        () => events.onFinish(),
      )
    }
  })

  return {
    start() {
      if (ctx.phase !== 'idle') return
      ctx.phase = 'riding'
      ctx.speedScale = 1
    },
    resumeFromMemory() {
      if (ctx.phase !== 'memory') return
      ctx.phase = 'riding'
      memory.exit()
    },
    pause() {
      k.debug.paused = true
    },
    resume() {
      k.debug.paused = false
    },
    destroy() {
      k.quit()
    },
    setDistance(d) {
      ctx.distance = d
    },
    getDistance() {
      return ctx.distance
    },
  }
}
