import { FLASH_TINT, HIT } from './config'
import { hexToRgb } from './world'
import type { RideCtx } from './types'

export type HitFlash = {
  fire(): void
}

export function setupHitFlash(ctx: RideCtx): HitFlash {
  const { k } = ctx

  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const overlay = k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(...hexToRgb(FLASH_TINT)),
    k.opacity(0),
    k.z(51),
  ])

  let flashing = false

  return {
    fire() {
      if (reduced || flashing) return
      flashing = true
      k.tween(overlay.opacity, HIT.flashOpacity, HIT.flashIn, (v) => (overlay.opacity = v)).onEnd(
        () => {
          k.tween(
            overlay.opacity,
            0,
            HIT.flashOut,
            (v) => (overlay.opacity = v),
            k.easings.easeOutQuad,
          ).onEnd(() => (flashing = false))
        },
      )
    },
  }
}
