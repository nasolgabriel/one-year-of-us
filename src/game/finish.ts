import { COLORS } from '@/lib/constants'
import { balloonOps, emit, garlandOps, miniHeartOps, rieOps, sparkleOps } from './sprites'
import { FINISH_ART, PLAYER_X_FRAC } from './config'
import { GROUND_Y } from './world'
import type { RideCtx } from './types'

// The finish beat (art pass 05): a pennant garland strung over the road, Rie
// waiting with a heart balloon, a cluster of mini hearts and sparkles between
// the stopping bike and her. Scrolls in with the world and comes to rest as
// the brake tween lands, so "and there you were" happens in-frame.
export function setupFinishTableau(ctx: RideCtx) {
  const { k } = ctx
  const W = k.width()

  // Rest position puts her ~59vpx ahead of the rider's wheel line.
  const restX = W * PLAYER_X_FRAC - 24
  const spawnX = W + 20
  const trigger = ctx.timeline.finish + FINISH_ART.brakeDistance - spawnX + restX

  let spawned = false
  k.onUpdate(() => {
    if (spawned || ctx.distance < trigger) return
    spawned = true

    const root = k.add([k.pos(spawnX, GROUND_Y), k.z(9), 'scrolling'])
    emit(k, root, garlandOps(2, 113, -24))
    emit(k, root, rieOps(), 83, -37)

    // Mini hearts + sparkles celebrate in the gap where the bike will stop.
    const hearts: [number, number, string][] = [
      [48, -40, COLORS.pinkDeep],
      [56, -50, COLORS.pink],
      [68, -32, COLORS.pinkDeep],
      [76, -52, COLORS.pink],
      [62, -60, COLORS.pinkDeep],
    ]
    for (const [hx, hy, c] of hearts) emit(k, root, miniHeartOps(c), hx, hy)
    emit(k, root, sparkleOps(COLORS.peachSoft, 0.7), 52, -56)
    emit(k, root, sparkleOps(COLORS.peachSoft, 0.7), 72, -42)

    // Heart balloon on a curved string down to her raised hand, bobbing.
    const balloon = root.add([k.pos(0, 0)])
    emit(k, balloon, balloonOps(94, -67, 85, -32))
    let t = Math.random() * Math.PI * 2
    balloon.onUpdate(() => {
      t += k.dt()
      balloon.pos.y = Math.sin(t * 1.6) * 2
    })
  })
}
