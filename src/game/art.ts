import type { GameObj, KAPLAYCtx } from 'kaplay'
import { COLORS } from '@/lib/constants'
import { hexToRgb } from './world'

// Shared composed-shape builders. The brand draws its "icons" from primitives
// (see .claude/README.md motif library) — same approach here: no sprite files,
// every mark is circles/rects/polygons in palette colours.

// The signature 7×7 pixel heart, row-encoded. Rendered as one rect per
// horizontal run, centred on the parent's origin.
const HEART_ROWS = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']

export function buildPixelHeart(k: KAPLAYCtx, parent: GameObj, px: number, color: string) {
  const rgb = hexToRgb(color)
  const w = HEART_ROWS[0].length * px
  const h = HEART_ROWS.length * px
  HEART_ROWS.forEach((row, y) => {
    let run = -1
    for (let x = 0; x <= row.length; x++) {
      const on = x < row.length && row[x] === 'X'
      if (on && run < 0) run = x
      if (!on && run >= 0) {
        parent.add([
          k.rect((x - run) * px, px),
          k.pos(run * px - w / 2, y * px - h / 2),
          k.color(...rgb),
          k.opacity(1),
        ])
        run = -1
      }
    }
  })
}

// Sophie's head, shared between the sitting pose and the basket pose so she
// stays the same cat. Origin = centre of the head; she faces left.
export function buildSophieHead(k: KAPLAYCtx, parent: GameObj, at: [number, number]) {
  const white = hexToRgb(COLORS.peachSoft)
  const ginger = hexToRgb(COLORS.amber)
  const ink = hexToRgb(COLORS.locked)
  const [hx, hy] = at
  parent.add([k.circle(4.5), k.pos(hx, hy), k.color(...white), k.opacity(1)])
  parent.add([
    k.polygon([k.vec2(-4, 0), k.vec2(-1, 0), k.vec2(-2.8, -3.6)]),
    k.pos(hx, hy - 3),
    k.color(...white),
    k.opacity(1),
  ])
  parent.add([
    k.polygon([k.vec2(1, 0), k.vec2(4, 0), k.vec2(2.2, -3.6)]),
    k.pos(hx, hy - 3),
    k.color(...ginger),
    k.opacity(1),
  ])
  parent.add([k.circle(2.6), k.pos(hx + 2, hy - 1.5), k.color(...ginger), k.opacity(1)])
  parent.add([k.rect(1.2, 1.2), k.pos(hx - 4.4, hy + 0.4), k.color(...hexToRgb(COLORS.pinkDeep)), k.opacity(1)])
  parent.add([k.rect(1, 1), k.pos(hx - 2.6, hy - 1.2), k.color(...ink), k.opacity(1)])
}

// Sitting pose for the pickup beat. Origin = paws on the ground. Returns the
// tail so the cutscene can swish it.
export function buildSittingSophie(k: KAPLAYCtx, parent: GameObj): { tail: GameObj } {
  const white = hexToRgb(COLORS.peachSoft)
  const ginger = hexToRgb(COLORS.amber)
  const tail = parent.add([
    k.rect(9, 2.2),
    k.pos(3, -3),
    k.color(...ginger),
    k.opacity(1),
  ])
  parent.add([k.circle(5.5), k.pos(0.5, -6), k.scale(1, 1.25), k.color(...white), k.opacity(1)])
  parent.add([k.circle(3.4), k.pos(2.5, -8), k.color(...ginger), k.opacity(1)])
  parent.add([k.rect(2, 3.5), k.pos(-3.4, -3.5), k.color(...white), k.opacity(1)])
  parent.add([k.rect(2, 3.5), k.pos(-0.8, -3.5), k.color(...white), k.opacity(1)])
  buildSophieHead(k, parent, [-0.5, -15])
  return { tail }
}

// Basket pose — head plus two paws hooked over the basket rim. Origin sits at
// the basket rim's top-centre.
export function buildBasketSophie(k: KAPLAYCtx, parent: GameObj) {
  const white = hexToRgb(COLORS.peachSoft)
  buildSophieHead(k, parent, [0, -4])
  parent.add([k.rect(2, 2.5), k.pos(-3.6, -0.5), k.color(...white), k.opacity(1)])
  parent.add([k.rect(2, 2.5), k.pos(-0.8, -0.5), k.color(...white), k.opacity(1)])
}
