'use client'

import type { CSSProperties, ReactNode } from 'react'

const CREAM = '#FAEEDA'
const HEART = '#D4537E'
const HEART_DIM = 'rgba(250,238,218,0.55)'

// The signature 7×7 pixel heart as crisp SVG rects — shared with MemoryCard.
const HEART_ROWS = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']

export function PixelHeartSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 7 7"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
      aria-hidden
    >
      {HEART_ROWS.flatMap((row, y) =>
        row.split('').map((c, x) =>
          c === 'X' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null,
        ),
      )}
    </svg>
  )
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: CREAM,
  background: 'rgba(26,26,46,0.32)',
  border: '1px dashed rgba(250,238,218,0.5)',
  borderRadius: 2,
  padding: '6px 8px 5px',
  whiteSpace: 'nowrap',
}

export function HudChip({ children }: { children: ReactNode }) {
  return (
    <span className="font-sans" style={chipStyle}>
      {children}
    </span>
  )
}

// The ride HUD — DOM overlay over the canvas, per the art pass: act chip and
// heart counter up top, a hairline progress track with the five milestone
// hearts, the accent marker, and a ✧ at the finish.
export default function RideHud({
  act,
  hearts,
  progress,
  milestones,
  passed,
  dim,
}: {
  act: string
  hearts: number
  progress: number
  milestones: number[]
  passed: boolean[]
  dim: boolean
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10"
      style={{ padding: '14px 14px 0', opacity: dim ? 0.35 : 1, transition: 'opacity 0.4s' }}
    >
      <div className="flex items-start justify-between">
        <HudChip>{act}</HudChip>
        <HudChip>
          <PixelHeartSvg size={9} color={HEART} />
          <b
            className="font-serif"
            style={{
              fontWeight: 600,
              fontStyle: 'normal',
              fontSize: 12,
              lineHeight: 0.8,
              letterSpacing: '0.06em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ×&hairsp;{hearts}
          </b>
        </HudChip>
      </div>

      <div className="relative mx-auto" style={{ width: 108, height: 12, marginTop: 12 }}>
        <i
          className="absolute"
          style={{ left: 0, right: 0, top: 5, height: 1, background: 'rgba(250,238,218,0.4)' }}
        />
        {milestones.map((p, i) => (
          <span key={i} className="absolute" style={{ left: `${p}%`, top: 2, marginLeft: -3.5, lineHeight: 0 }}>
            <PixelHeartSvg size={7} color={passed[i] ? HEART : HEART_DIM} />
          </span>
        ))}
        <i
          className="absolute"
          style={{
            left: `${Math.min(progress, 100)}%`,
            top: 3,
            width: 4,
            height: 4,
            marginLeft: -2,
            background: '#D85A30',
            boxShadow: '0 0 6px 1px rgba(216,90,48,0.8)',
          }}
        />
        <span
          className="absolute font-sans"
          style={{ right: -13, top: -1, fontSize: 9, color: 'rgba(250,238,218,0.7)' }}
        >
          ✧
        </span>
      </div>
    </div>
  )
}
