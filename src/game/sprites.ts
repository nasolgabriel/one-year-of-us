import type { GameObj, KAPLAYCtx } from 'kaplay'
import { COLORS } from '@/lib/constants'

// Pixel sprite library — a 1:1 port of the art pass's ride-sprites.js
// (.claude/ride-sprites.js). 1 unit = 1 kaplay virtual px. Every sprite is a
// list of pixel ops (rect runs) emitted as k.rect children, so the game stays
// primitive-composed with no sprite files.

// Sophie palette — lifted 1:1 from Sophie.tsx.
export const S = {
  w:  '#FCF3E8',
  wh: '#FFFFFF',
  g:  '#E89456',
  gh: '#F2A968',
  gl: '#CC7339',
  o:  '#8A6047',
  ie: '#F2B3B8',
  n:  '#E0859A',
  e:  '#4A3322',
  z:  '#CC7A42',
} as const

// The rider shares Sophie's warm highlight as a skin tone (art pass swatch).
export const RIDER_SKIN = S.gh

const PAPER = '#FFFDF7'

export type PxOp = [x: number, y: number, w: number, h: number, c: string, o: number]

const P = (a: PxOp[], x: number, y: number, c: string, w = 1, h = 1, o = 1) => {
  a.push([x, y, w, h, c, o])
}

// Bresenham pixel line, thickness t (t×t blocks per step).
function line(a: PxOp[], x0: number, y0: number, x1: number, y1: number, c: string, t = 1, o = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
  let dx = Math.abs(x1 - x0)
  const sx = x0 < x1 ? 1 : -1
  let dy = -Math.abs(y1 - y0)
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    P(a, x0, y0, c, t, t, o)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
}

// Filled pixel disc, rasterized as horizontal runs.
function disc(a: PxOp[], cx: number, cy: number, r: number, c: string, o = 1) {
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5)
    P(a, cx - hw, cy + dy, c, hw * 2 + 1, 1, o)
  }
}

// Midpoint-circle 1px ring.
function ring(a: PxOp[], cx: number, cy: number, r: number, c: string, o = 1) {
  let x = r
  let y = 0
  let err = 1 - r
  const seen = new Set<string>()
  const put = (px: number, py: number) => {
    const key = `${px},${py}`
    if (!seen.has(key)) {
      seen.add(key)
      P(a, cx + px, cy + py, c, 1, 1, o)
    }
  }
  while (x >= y) {
    put(x, y); put(y, x); put(-y, x); put(-x, y)
    put(-x, -y); put(-y, -x); put(y, -x); put(x, -y)
    y++
    if (err < 0) err += 2 * y + 1
    else { x--; err += 2 * (y - x) + 1 }
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Emit ops as rect children of `parent`, offset by (ox, oy).
export function emit(k: KAPLAYCtx, parent: GameObj, ops: PxOp[], ox = 0, oy = 0) {
  for (const [x, y, w, h, c, o] of ops) {
    parent.add([k.rect(w, h), k.pos(ox + x, oy + y), k.color(...hexToRgb(c)), k.opacity(o)])
  }
}

// ── motifs ──────────────────────────────────────────────

// 7×7 signature heart.
export function heartOps(c: string): PxOp[] {
  const a: PxOp[] = []
  P(a, 1, 0, c, 2); P(a, 4, 0, c, 2)
  P(a, 0, 1, c, 7); P(a, 0, 2, c, 7); P(a, 0, 3, c, 7)
  P(a, 1, 4, c, 5); P(a, 2, 5, c, 3); P(a, 3, 6, c, 1)
  return a
}

export function heartHiOps(c: string, hi: string): PxOp[] {
  const a = heartOps(c)
  P(a, 1, 1, hi, 1, 1, 0.7)
  return a
}

// 3×3.
export function miniHeartOps(c: string): PxOp[] {
  const a: PxOp[] = []
  P(a, 0, 0, c); P(a, 2, 0, c); P(a, 0, 1, c, 3); P(a, 1, 2, c)
  return a
}

// 3×3.
export function sparkleOps(c: string, o = 1): PxOp[] {
  const a: PxOp[] = []
  P(a, 1, 0, c, 1, 1, o); P(a, 0, 1, c, 3, 1, o); P(a, 1, 2, c, 1, 1, o)
  return a
}

// 3×3 — Sophie's sleep marks only.
export function zGlyphOps(o = 1): PxOp[] {
  const a: PxOp[] = []
  P(a, 0, 0, S.z, 3, 1, o); P(a, 1, 1, S.z, 1, 1, o); P(a, 0, 2, S.z, 3, 1, o)
  return a
}

// 1px pixel ring centred on (0,0) — the sun's halo.
export function ringOps(r: number, c: string, o = 1): PxOp[] {
  const a: PxOp[] = []
  ring(a, 0, 0, r, c, o)
  return a
}

// 14×3 flat pixel cloud.
export function cloudOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 3, 0, COLORS.peachSoft, 7)
  P(a, 1, 1, COLORS.peachSoft, 12)
  P(a, 0, 2, COLORS.peachSoft, 14)
  return a
}

// ── collectibles ────────────────────────────────────────

// 8×10.
export function polaroidOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 0, 0, PAPER, 8, 10)
  P(a, 1, 1, COLORS.purpleSoft, 6, 3)
  P(a, 1, 4, COLORS.purple, 6, 3)
  P(a, 3, 3, COLORS.pinkDeep)
  P(a, 2, 8, S.o, 4, 1, 0.3)
  return a
}

// 8×8 + tail.
export function yarnOps(): PxOp[] {
  const a: PxOp[] = []
  disc(a, 3, 3, 3, COLORS.mint)
  P(a, 1, 2, COLORS.mintDark, 3, 1)
  P(a, 3, 4, COLORS.mintDark, 3, 1)
  P(a, 2, 1, S.wh, 2, 1, 0.5)
  P(a, 6, 6, COLORS.mintDark)
  P(a, 7, 7, COLORS.mintDark, 3, 1)
  return a
}

// 7×4.
export function butterflyOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 2, 0, S.e); P(a, 4, 0, S.e)
  P(a, 0, 1, COLORS.pinkDeep, 3); P(a, 4, 1, COLORS.pinkDeep, 3)
  P(a, 1, 2, COLORS.pink, 2); P(a, 4, 2, COLORS.pink, 2)
  P(a, 2, 3, COLORS.pink); P(a, 4, 3, COLORS.pink)
  P(a, 3, 1, S.e, 1, 3)
  return a
}

// ── obstacles (origins at top-left; footprints in spawner) ──

// 10×10 — pot with a small bloom.
export function flowerPotOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 0, 5, COLORS.rose, 10, 1)
  P(a, 1, 6, COLORS.rose, 8, 2)
  P(a, 2, 8, COLORS.rose, 6, 2)
  P(a, 1, 6, COLORS.pink, 1, 1, 0.45)
  P(a, 4, 3, COLORS.mintDark, 1, 2)
  P(a, 5, 4, COLORS.mintDark)
  P(a, 4, 0, COLORS.pink); P(a, 3, 1, COLORS.pink); P(a, 5, 1, COLORS.pink); P(a, 4, 2, COLORS.pink)
  P(a, 4, 1, COLORS.pinkDeep)
  P(a, 7, 3, COLORS.pink)
  P(a, 7, 4, COLORS.mintDark, 1, 1, 0.8)
  return a
}

// 16×3.
export function puddleOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 2, 0, COLORS.lockedSoft, 12, 1)
  P(a, 0, 1, COLORS.lockedSoft, 16, 1)
  P(a, 2, 2, COLORS.lockedSoft, 12, 1)
  P(a, 3, 1, COLORS.peachSoft, 3, 1, 0.4)
  return a
}

// 4×14.
export function fenceOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 1, 0, COLORS.locked, 2, 1)
  P(a, 0, 1, COLORS.locked, 4, 13)
  P(a, 0, 1, COLORS.lockedSoft, 1, 13)
  return a
}

// 15×8 — awake, watching.
export function dogOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 1, 3, COLORS.twilight, 10, 1)
  P(a, 0, 4, COLORS.twilight, 12, 3)
  P(a, 10, 1, COLORS.twilight, 4, 4)
  P(a, 9, 0, COLORS.twilightDark, 1, 3)
  P(a, 13, 0, COLORS.twilightDark)
  P(a, 11, 2, COLORS.peachSoft)
  P(a, 14, 3, COLORS.twilightDark)
  P(a, 0, 2, COLORS.twilightDark)
  P(a, 1, 1, COLORS.twilightDark)
  P(a, 10, 5, COLORS.accentAlt, 2, 1)
  P(a, 2, 7, COLORS.twilightDark, 2, 1)
  P(a, 6, 7, COLORS.twilightDark, 2, 1)
  return a
}

// 18×4 coil.
export function hoseOps(): PxOp[] {
  const a: PxOp[] = []
  ring(a, 3, 2, 2, COLORS.mintDark)
  ring(a, 8, 2, 2, COLORS.mintDark)
  ring(a, 13, 2, 2, COLORS.mintDark)
  P(a, 2, 0, COLORS.mint, 1, 1, 0.6)
  P(a, 7, 0, COLORS.mint, 1, 1, 0.6)
  P(a, 12, 0, COLORS.mint, 1, 1, 0.6)
  P(a, 15, 1, COLORS.accent, 2, 1)
  return a
}

// ── Sophie ──────────────────────────────────────────────

// 7×6 head over the basket rim.
export function sophieBasketHeadOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 1, 0, S.g); P(a, 5, 0, S.g)
  P(a, 1, 1, S.g, 2); P(a, 4, 1, S.g, 2)
  P(a, 1, 1, S.ie, 1, 1, 0.9); P(a, 5, 1, S.ie, 1, 1, 0.9)
  P(a, 0, 2, S.g, 7, 1)
  P(a, 0, 3, S.w, 7); P(a, 6, 3, S.g)
  P(a, 0, 4, S.w, 7); P(a, 1, 4, S.e); P(a, 5, 4, S.e)
  P(a, 3, 5, S.n); P(a, 0, 5, S.w, 3); P(a, 4, 5, S.w, 3)
  return a
}

// 15×10 curled asleep at the roadside, with a ground shadow.
export function sophieRoadsideOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, 1, 10, S.o, 13, 1, 0.16)
  P(a, 2, 4, S.w, 7, 1); P(a, 1, 5, S.w, 9, 1); P(a, 0, 6, S.w, 10, 3); P(a, 1, 9, S.w, 8, 1)
  P(a, 2, 4, S.g, 6, 1); P(a, 1, 5, S.g, 7, 1); P(a, 2, 5, S.gh, 3, 1, 0.6)
  P(a, 0, 7, S.gl, 1, 2); P(a, 1, 9, S.gl, 9, 1); P(a, 10, 8, S.g, 1, 1)
  P(a, 10, 1, S.g); P(a, 13, 1, S.g); P(a, 10, 2, S.g, 4, 1)
  P(a, 10, 2, S.ie, 1, 1, 0.8); P(a, 13, 2, S.ie, 1, 1, 0.8)
  P(a, 9, 3, S.g); P(a, 10, 3, S.w, 4); P(a, 14, 3, S.g)
  P(a, 9, 4, S.w, 6); P(a, 10, 4, S.e); P(a, 13, 4, S.e)
  P(a, 9, 5, S.w, 6); P(a, 11, 5, S.n)
  P(a, 10, 6, S.w, 4)
  P(a, 8, 8, S.w, 2, 1); P(a, 9, 8, S.o, 1, 1, 0.4)
  return a
}

// Awake sitting pose for the wake beat — basket head over an upright pixel
// chest; not in the sprite sheet, composed from its pieces so she matches.
// Origin = ground under her paws. Returns tail ops separately so the cutscene
// can swish it (drawn as one child rect).
export function sophieSittingOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, -3, -7, S.w, 6, 6)
  P(a, -3, -7, S.g, 6, 2)
  P(a, 0, -5, S.g, 3, 3)
  P(a, -3, -1, S.w, 2, 1); P(a, 0, -1, S.w, 2, 1)
  return a
}

// ── rider — 40×36, ground contact at y=36 ───────────────

export type RiderVariant = { frame: string; shirt: string; pants: string }

// Variant B "mint step-through" — black tee on a mint frame.
export const RIDER_B: RiderVariant = {
  frame: COLORS.mint,
  shirt: COLORS.locked,
  pants: COLORS.twilightDark,
}

// Static body: wheels (no spokes), frame, crank, seat, bar, basket, torso,
// arm, head. Spokes and legs are separate so they can animate.
export function riderBodyOps(v: RiderVariant): PxOp[] {
  const a: PxOp[] = []
  const ink = COLORS.locked
  const inkS = COLORS.lockedSoft
  const F = v.frame
  const skin = S.gh
  const skinLo = S.gl
  const hair = COLORS.locked
  const shirt = v.shirt
  ring(a, 10, 29, 6, ink); ring(a, 30, 29, 6, ink)
  P(a, 9, 28, inkS, 2, 2); P(a, 29, 28, inkS, 2, 2)
  line(a, 10, 29, 19, 26, F); line(a, 19, 26, 15, 16, F); line(a, 19, 26, 28, 16, F)
  line(a, 15, 16, 27, 16, F); line(a, 28, 16, 30, 29, F)
  ring(a, 19, 27, 2, inkS, 0.6)
  line(a, 19, 27, 17, 29, ink); line(a, 19, 27, 21, 25, ink)
  P(a, 15, 29, ink, 3, 1); P(a, 20, 24, ink, 3, 1)
  P(a, 11, 13, ink, 6, 1); P(a, 12, 14, ink, 4, 1); line(a, 14, 15, 15, 16, F)
  line(a, 28, 16, 27, 12, F); P(a, 24, 11, ink, 4, 1); P(a, 27, 12, ink, 1, 1)
  // Basket (wicker).
  P(a, 30, 12, S.gl, 9, 1); P(a, 30, 13, S.gh, 9, 6)
  P(a, 30, 15, S.gl, 9, 1, 0.55); P(a, 30, 17, S.gl, 9, 1, 0.55)
  P(a, 30, 13, S.gl, 1, 6); P(a, 38, 13, S.gl, 1, 6); P(a, 30, 19, S.gl, 9, 1)
  line(a, 30, 15, 29, 17, S.gl)
  // Torso lean.
  P(a, 12, 11, shirt, 3, 3); P(a, 13, 9, shirt, 3, 2); P(a, 14, 7, shirt, 3, 2); P(a, 15, 5, shirt, 3, 2)
  line(a, 17, 7, 25, 12, shirt, 1); P(a, 25, 12, skin, 2, 1)
  // Head.
  P(a, 17, 0, hair, 4, 1); P(a, 16, 1, hair, 6, 1); P(a, 16, 2, hair, 2, 1)
  P(a, 18, 2, skin, 4, 1); P(a, 17, 3, skin, 5, 1); P(a, 21, 3, S.e)
  P(a, 17, 4, skin, 4, 1); P(a, 16, 3, hair, 1, 2); P(a, 20, 4, skinLo, 1, 1, 0.5)
  return a
}

// Pedalling legs, two alternating pixel poses (A = art pass frame).
export function riderLegsOps(v: RiderVariant, pose: 0 | 1): PxOp[] {
  const a: PxOp[] = []
  const ink = COLORS.locked
  const back = COLORS.twilightDark
  const front = v.pants
  if (pose === 0) {
    line(a, 13, 13, 15, 20, back, 2); line(a, 15, 20, 15, 28, back, 2); P(a, 14, 28, ink, 3, 1)
    line(a, 14, 13, 18, 19, front, 2); line(a, 18, 19, 21, 23, front, 2); P(a, 19, 23, ink, 3, 1)
  } else {
    line(a, 13, 13, 17, 19, back, 2); line(a, 17, 19, 20, 23, back, 2); P(a, 18, 23, ink, 3, 1)
    line(a, 14, 13, 15, 20, front, 2); line(a, 15, 20, 15, 28, front, 2); P(a, 14, 28, ink, 3, 1)
  }
  return a
}

// Spoke cross for one wheel, centred on the hub — rotate the parent group.
export function spokeOps(): PxOp[] {
  const a: PxOp[] = []
  line(a, 0, -3, 0, 3, COLORS.lockedSoft, 1, 0.25)
  line(a, -3, 0, 3, 0, COLORS.lockedSoft, 1, 0.25)
  return a
}

// Speed dashes + ground dust behind the rider, relative to the rider's ground
// contact point.
export function motionFxOps(): PxOp[] {
  const a: PxOp[] = []
  P(a, -32, -20, COLORS.peachSoft, 4, 1, 0.35)
  P(a, -30, -14, COLORS.peachSoft, 5, 1, 0.28)
  P(a, -34, -8, COLORS.peachSoft, 4, 1, 0.2)
  disc(a, -25, 1, 1, COLORS.peachSoft, 0.5)
  disc(a, -29, 2, 1, COLORS.peachSoft, 0.3)
  return a
}

// ── Rie — 12×37, ground at y=37 ─────────────────────────

export function rieOps(): PxOp[] {
  const a: PxOp[] = []
  const skin = S.gh
  const hair = COLORS.locked
  const dress = S.w
  P(a, 4, 0, hair, 4, 1); P(a, 3, 1, hair, 6, 1); P(a, 3, 2, hair, 6, 1)
  P(a, 3, 3, hair); P(a, 4, 3, skin, 4); P(a, 8, 3, hair)
  P(a, 3, 4, hair); P(a, 4, 4, skin, 4); P(a, 4, 4, S.e); P(a, 8, 4, hair)
  P(a, 5, 5, S.ie, 1, 1, 0.8)
  P(a, 3, 5, hair); P(a, 4, 5, skin, 4); P(a, 8, 5, hair)
  P(a, 8, 6, hair, 2, 9); P(a, 9, 15, hair, 1, 1)
  P(a, 5, 6, skin, 2, 1)
  P(a, 1, 2, skin); P(a, 2, 3, skin); line(a, 2, 4, 4, 7, dress, 1)
  P(a, 4, 7, dress, 4, 1); P(a, 3, 8, dress, 5, 1); P(a, 4, 9, dress, 4, 6)
  P(a, 3, 15, dress, 6, 2); P(a, 3, 17, dress, 6, 2)
  P(a, 2, 19, dress, 8, 2); P(a, 2, 21, dress, 8, 2)
  P(a, 2, 22, S.ie, 8, 1, 0.4)
  P(a, 4, 23, skin, 1, 11); P(a, 7, 23, skin, 1, 11)
  P(a, 3, 34, COLORS.locked, 2, 3); P(a, 7, 34, COLORS.locked, 2, 3)
  return a
}

// Heart-shaped balloon at (x, y) with a curved string down to (handX, handY).
export function balloonOps(x: number, y: number, handX: number, handY: number): PxOp[] {
  const a: PxOp[] = []
  for (const [hx, hy, hw, hh, c, o] of heartHiOps(COLORS.pinkDeep, COLORS.pink)) {
    P(a, x + hx, y + hy, c, hw, hh, o)
  }
  // Quadratic string, sampled to pixels.
  const x0 = x + 3.5
  const y0 = y + 7
  const cx = x + 1
  const cy = (y0 + handY) / 2
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * handX
    const qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * handY
    P(a, Math.round(qx), Math.round(qy), S.o, 1, 1, 0.7)
  }
  return a
}

// Pennant garland strung between two planted posts; x0..x1, string at y.
export function garlandOps(x0: number, x1: number, y: number): PxOp[] {
  const a: PxOp[] = []
  P(a, x0, y - 2, S.gl, 2, 28)
  P(a, x1 - 1, y - 2, S.gl, 2, 28)
  const cols = [COLORS.pink, COLORS.peachSoft, COLORS.mint, COLORS.pinkDeep]
  // String: quadratic sag, sampled to pixels.
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const sx = x0 + 1 + (x1 - x0 - 1) * t
    const sy = y + 9 * 4 * t * (1 - t) * 0.55
    P(a, Math.round(sx), Math.round(sy), S.o, 1, 1, 0.6)
  }
  for (let i = 0; i < 8; i++) {
    const t = (i + 1) / 9
    const mx = x0 + 1 + (x1 - x0 - 1) * t
    const my = y + 9 * 4 * t * (1 - t) * 0.55 + 1
    const c = cols[i % 4]
    P(a, Math.round(mx) - 1, Math.round(my), c, 3, 1)
    P(a, Math.round(mx), Math.round(my) + 1, c, 1, 2)
  }
  return a
}

// ── roadside scenery bits (spawned scrolling by world.ts) ──

// 2×2 bloom + stem, colours cycled by the spawner.
export function roadsideFlowerOps(c: string): PxOp[] {
  const a: PxOp[] = []
  P(a, 0, -3, c, 2, 2)
  P(a, 0, -1, COLORS.mintDark, 1, 1, 0.8)
  return a
}

// Little grass stubble cluster on the fringe.
export function stubbleOps(c: string): PxOp[] {
  const a: PxOp[] = []
  P(a, 0, -1, c, 1, 1, 0.85)
  P(a, 2, -2, c, 1, 2, 0.85)
  P(a, 5, -1, c, 1, 1, 0.85)
  return a
}
