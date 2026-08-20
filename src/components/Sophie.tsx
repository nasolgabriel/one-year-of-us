'use client'

// Sophie — pixel build on the ride's 1-unit grid (see .claude/ride-sprites.js
// `sophieHero`), so the hero cat and the in-game cat are literally the same art.
const C = {
  white:    '#FCF3E8',
  whiteHi:  '#FFFFFF',
  ginger:   '#E89456',
  gingerHi: '#F2A968',
  gingerLo: '#CC7339',
  outline:  '#8A6047',
  innerEar: '#F2B3B8',
  nose:     '#E0859A',
  eye:      '#4A3322',
  zColor:   '#CC7A42',
} as const

type Px = [x: number, y: number, c: string, w?: number, h?: number, o?: number]

const SHADOW: Px[] = [
  [3, 23, C.outline, 32, 2, 0.12],
]

const BODY: Px[] = [
  [8, 10, C.white, 17, 1],
  [6, 11, C.white, 21, 1],
  [5, 12, C.white, 23, 1],
  [4, 13, C.white, 25, 6],
  [5, 19, C.white, 23, 1],
  [6, 20, C.white, 21, 1],
  [8, 10, C.ginger, 17, 1],
  [7, 11, C.ginger, 14, 1],
  [6, 12, C.ginger, 10, 1],
  [9, 11, C.gingerHi, 6, 1, 0.6],
  [6, 20, C.gingerLo, 21, 1, 0.3],
  [25, 18, C.whiteHi, 3, 2],
  [29, 18, C.whiteHi, 3, 2],
  [26, 18, C.outline, 1, 1, 0.25],
  [30, 18, C.outline, 1, 1, 0.25],
]

// Cream tail with ginger ring stripes; the tip lives in its own group so it can flick.
const TAIL: Px[] = [
  [2, 13, C.white, 2, 1],
  [1, 14, C.white, 2, 6],
  [1, 15, C.ginger, 2, 1],
  [1, 18, C.ginger, 2, 1],
  [2, 20, C.white, 2, 1],
  [4, 20, C.white, 16, 2],
  [4, 21, C.gingerLo, 16, 1, 0.3],
  [7, 20, C.ginger, 2, 2],
  [12, 20, C.ginger, 2, 2],
  [17, 20, C.ginger, 2, 2],
]

const TAIL_TIP: Px[] = [
  [20, 19, C.ginger, 3, 2],
  [22, 18, C.ginger, 2, 2],
  [23, 17, C.gingerHi, 1, 1, 0.7],
]

const HEAD: Px[] = [
  [25, 6, C.white, 9, 1],
  [24, 7, C.white, 11, 1],
  [23, 8, C.white, 13, 8],
  [24, 16, C.white, 11, 1],
  [25, 17, C.white, 9, 1],
  [25, 6, C.ginger, 9, 1],
  [24, 7, C.ginger, 8, 1],
  [23, 8, C.ginger, 5, 1],
  [26, 7, C.gingerHi, 4, 1, 0.5],
  [24, 3, C.ginger],
  [23, 4, C.ginger, 3, 1],
  [23, 5, C.ginger, 3, 1],
  [24, 4, C.innerEar, 1, 1, 0.9],
  [25, 11, C.eye],
  [26, 12, C.eye, 2, 1],
  [28, 11, C.eye],
  [30, 11, C.eye],
  [31, 12, C.eye, 2, 1],
  [33, 11, C.eye],
  [29, 14, C.nose],
  [28, 15, C.outline, 1, 1, 0.5],
  [30, 15, C.outline, 1, 1, 0.5],
  [24, 13, C.innerEar, 2, 1, 0.5],
  [33, 13, C.innerEar, 2, 1, 0.5],
  [20, 12, C.outline, 2, 1, 0.4],
  [20, 14, C.outline, 2, 1, 0.35],
  [36, 12, C.outline, 2, 1, 0.4],
  [36, 14, C.outline, 2, 1, 0.35],
]

const EAR_R: Px[] = [
  [32, 3, C.ginger],
  [31, 4, C.ginger, 3, 1],
  [31, 5, C.ginger, 3, 1],
  [32, 4, C.innerEar, 1, 1, 0.9],
]

const Z_GLYPH: Px[] = [
  [0, 0, C.zColor, 3, 1, 0.9],
  [1, 1, C.zColor, 1, 1, 0.9],
  [0, 2, C.zColor, 3, 1, 0.9],
]

const Z_PUFFS = [
  { x: 34, y: -3,  delay: 0   },
  { x: 37, y: -8,  delay: 1.4 },
  { x: 40, y: -13, delay: 2.8 },
]

function draw(pixels: Px[]) {
  return pixels.map(([x, y, fill, w = 1, h = 1, o = 1], i) => (
    <rect key={i} x={x} y={y} width={w} height={h} fill={fill} opacity={o} />
  ))
}

type SophieVariant = 'sleeping'

interface SophieProps {
  variant?: SophieVariant
  className?: string
}

function SleepingCat() {
  return (
    <svg
      viewBox="0 -24 44 50"
      shapeRendering="crispEdges"
      className="sophie-px"
      style={{ display: 'block', width: 'clamp(88px, 10vw, 110px)', height: 'auto' }}
    >
      <g>{draw(SHADOW)}</g>
      <g className="sophie-breathe">
        <g>{draw(BODY)}</g>
        <g>{draw(HEAD)}</g>
        <g className="sophie-ear">{draw(EAR_R)}</g>
      </g>
      <g>{draw(TAIL)}</g>
      <g className="sophie-tail-tip">{draw(TAIL_TIP)}</g>
      {Z_PUFFS.map((z, i) => (
        <g key={i} className="sophie-z" style={{ '--delay': `${z.delay}s` } as React.CSSProperties}>
          {/* Placement sits on an inner group — the animation owns `transform` on the outer one. */}
          <g transform={`translate(${z.x} ${z.y})`}>{draw(Z_GLYPH)}</g>
        </g>
      ))}
    </svg>
  )
}

export default function Sophie({ variant = 'sleeping', className = '' }: SophieProps) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      {variant === 'sleeping' && <SleepingCat />}
    </div>
  )
}
