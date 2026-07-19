import kaplay from 'kaplay'
import { GROUND_COLOR, GROUND_HEIGHT, SKY_COLOR, VIRTUAL_HEIGHT } from './config'
import type { GameEvents, GameHandle, RideCtx } from './types'

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

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

  const ctx: RideCtx = { k, events, phase: 'idle', distance: 0 }

  k.add([
    k.rect(width, GROUND_HEIGHT),
    k.pos(0, VIRTUAL_HEIGHT - GROUND_HEIGHT),
    k.color(...hexToRgb(GROUND_COLOR)),
  ])

  return {
    start() {
      if (ctx.phase !== 'idle') return
      ctx.phase = 'riding'
    },
    resumeFromMemory() {
      if (ctx.phase !== 'memory') return
      ctx.phase = 'riding'
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
