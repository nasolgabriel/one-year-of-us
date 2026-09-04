import kaplay from 'kaplay'
import { COLORS } from '@/lib/constants'
import { VIRTUAL_HEIGHT } from './config'
import {
  destroyAudio,
  initAudio,
  resetCombo,
  setAudioSuspended,
  sfxFinish,
  sfxMilestone,
  unlockAudio,
} from './audio'
import { setupFinishTableau } from './finish'
import { setupHitFlash } from './hitFlash'
import { setupMemoryMode } from './memoryMode'
import { setupMilestonePolaroid } from './milestonePolaroid'
import { setupPlayer } from './player'
import { setupSophiePickup } from './sophiePickup'
import { setupSpawner } from './spawner'
import { hexToRgb, setupWorld } from './world'
import type { GameEvents, GameHandle, RideCtx, RideSettings } from './types'

export function createRideGame(
  canvas: HTMLCanvasElement,
  events: GameEvents,
  settings: RideSettings,
): GameHandle {
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
    background: hexToRgb(COLORS.green),
  })

  const ctx: RideCtx = {
    k,
    events,
    phase: 'idle',
    distance: 0,
    speedScale: 0,
    timeline: settings.timeline,
  }

  initAudio(k.audioCtx)

  setupWorld(ctx)
  const player = setupPlayer(ctx)
  const hitFlash = setupHitFlash(ctx)
  setupSpawner(ctx, player, hitFlash)
  const memory = setupMemoryMode(ctx)
  setupFinishTableau(ctx)
  setupSophiePickup(ctx, player, {
    onSequenceStart: () => {
      ctx.phase = 'pickup'
      events.onPickupStart()
    },
    onSequenceEnd: () => {
      ctx.phase = 'riding'
    },
  })

  // Memory mode fires when the rider catches a milestone polaroid — the
  // polaroid module owns spawn/catch; the phase write stays here.
  const milestones = setupMilestonePolaroid(ctx, player, settings.milestones, (def) => {
    ctx.phase = 'memory'
    resetCombo()
    sfxMilestone()
    memory.enter(() => events.onMilestone(def))
  })

  // Timeline supervisor — watches the distance clock for the finish beat.
  k.onUpdate(() => {
    if (ctx.phase !== 'riding') return
    if (ctx.distance >= ctx.timeline.finish) {
      ctx.phase = 'finished'
      sfxFinish()
      k.tween(ctx.speedScale, 0, 1.4, (v) => (ctx.speedScale = v), k.easings.easeOutQuad).onEnd(
        () => events.onFinish(),
      )
    }
  })

  return {
    start() {
      if (ctx.phase !== 'idle') return
      unlockAudio()
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
      setAudioSuspended(true)
      resetCombo()
    },
    resume() {
      k.debug.paused = false
      setAudioSuspended(false)
    },
    destroy() {
      destroyAudio()
      k.quit()
    },
    setDistance(d) {
      ctx.distance = d
      milestones.sync(d)
    },
    getDistance() {
      return ctx.distance
    },
  }
}
