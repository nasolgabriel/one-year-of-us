'use client'

import Image from 'next/image'
import { m } from 'framer-motion'
import { PixelHeartSvg } from '@/components/ui/RideHud'
import type { MilestoneDef } from '@/game/types'

const INK = '#4B1528'
const ACCENT = '#D85A30'
const PAPER = '#FFFDF7'

// Pixel heart · line · diamond · line · pixel heart, in accent — the polaroid's
// little ornament row (art pass 04).
function OrnamentRow() {
  return (
    <svg
      viewBox="0 0 96 7"
      width={96}
      height={7}
      shapeRendering="crispEdges"
      style={{ display: 'block', margin: '12px auto 0' }}
      aria-hidden
    >
      <g>
        {['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'].flatMap((row, y) =>
          row.split('').map((c, x) =>
            c === 'X' ? <rect key={`a${x}-${y}`} x={x} y={y} width={1} height={1} fill={ACCENT} /> : null,
          ),
        )}
      </g>
      <rect x={11} y={3} width={29} height={1} fill={ACCENT} opacity={0.4} />
      <rect x={46} y={2} width={1} height={1} fill={ACCENT} />
      <rect x={45} y={3} width={3} height={1} fill={ACCENT} />
      <rect x={46} y={4} width={1} height={1} fill={ACCENT} />
      <rect x={56} y={3} width={29} height={1} fill={ACCENT} opacity={0.4} />
      <g transform="translate(89 0)">
        {['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'].flatMap((row, y) =>
          row.split('').map((c, x) =>
            c === 'X' ? <rect key={`b${x}-${y}`} x={x} y={y} width={1} height={1} fill={ACCENT} /> : null,
          ),
        )}
      </g>
    </svg>
  )
}

// DOM overlay shown while the game idles in memory mode. Mount inside an
// AnimatePresence; onResume should call GameHandle.resumeFromMemory().
export default function MemoryCard({
  milestone,
  onResume,
}: {
  milestone: MilestoneDef
  onResume: () => void
}) {
  return (
    <m.div
      className="absolute inset-0 z-20 flex items-center justify-center px-6"
      style={{ background: 'rgba(75,21,40,0.32)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <m.div
        className="relative font-sans"
        style={{
          background: PAPER,
          borderRadius: 6,
          padding: '12px 12px 16px',
          width: 'min(272px, 100%)',
          boxShadow: '0 24px 60px -20px rgba(75,21,40,0.55)',
          rotate: '-1.5deg',
        }}
        initial={{ y: 48, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 32, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <i
          className="absolute"
          style={{
            top: -9,
            left: '50%',
            width: 66,
            height: 18,
            marginLeft: -33,
            background: 'rgba(250,199,117,0.6)',
            transform: 'rotate(-3deg)',
            boxShadow: '0 1px 2px rgba(75,21,40,0.12)',
          }}
          aria-hidden
        />

        <div
          className="relative flex flex-col items-center justify-center gap-2 overflow-hidden uppercase"
          style={{
            aspectRatio: '4 / 5',
            borderRadius: 3,
            background: 'linear-gradient(150deg, #534AB7 0%, #E24B6A 65%, #FAC775 100%)',
            color: '#FFF5F5',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.24em',
          }}
        >
          {milestone.photoUrl ? (
            <Image
              src={milestone.photoUrl}
              alt={milestone.title}
              fill
              sizes="640px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <>
              <PixelHeartSvg size={21} color="rgba(255,245,245,0.9)" />
              <span>memory {String(milestone.id).padStart(2, '0')} · photo</span>
            </>
          )}
        </div>

        <OrnamentRow />

        <p
          className="uppercase"
          style={{
            marginTop: 10,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.28em',
            color: ACCENT,
            opacity: 0.85,
          }}
        >
          {milestone.date}
        </p>
        <h3
          className="font-serif italic"
          style={{ marginTop: 5, fontSize: 21, lineHeight: 1.15, fontWeight: 600, color: INK }}
        >
          {milestone.title}
        </h3>
        <p
          className="font-serif italic"
          style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.55, color: INK, opacity: 0.75 }}
        >
          {milestone.caption}
        </p>

        <button
          onClick={onResume}
          className="font-sans"
          style={{
            marginTop: 14,
            width: '100%',
            padding: '10px 0',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: PAPER,
            background: ACCENT,
            borderRadius: 4,
          }}
        >
          keep riding →
        </button>
      </m.div>
    </m.div>
  )
}
