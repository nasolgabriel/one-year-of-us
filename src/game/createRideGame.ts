import kaplay from 'kaplay'
import { SKY_COLOR, VIRTUAL_HEIGHT } from './config'
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
    background: hexToRgb(SKY_COLOR),
  })

  const ctx: RideCtx = { k, events, phase: 'idle', distance: 0, speedScale: 0 }

  setupWorld(ctx)
  const player = setupPlayer(ctx)
  setupSpawner(ctx, player)

  return {
    start() {
      if (ctx.phase !== 'idle') return
      ctx.phase = 'riding'
      ctx.speedScale = 1
    },
    resumeFromMemory() {
      if (ctx.phase !== 'memory') return
      ctx.phase = 'riding'
      ctx.speedScale = 1
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
  }
}
