'use client'

import Image from 'next/image'
import { m } from 'framer-motion'
import type { MilestoneDef } from '@/game/types'

const INK = '#4B1528'
const ACCENT = '#D85A30'
const PAPER = '#FFFDF7'

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
        className="font-sans"
        style={{
          background: PAPER,
          borderRadius: 6,
          padding: '14px 14px 18px',
          width: 'min(320px, 100%)',
          boxShadow: '0 24px 60px -20px rgba(75,21,40,0.55)',
        }}
        initial={{ y: 48, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 32, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            aspectRatio: '4 / 5',
            borderRadius: 3,
            background: 'linear-gradient(150deg, #534AB7 0%, #E24B6A 65%, #FAC775 100%)',
            color: '#FFF5F5',
            fontSize: 13,
            letterSpacing: '0.16em',
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
            `memory ${milestone.id}`
          )}
        </div>

        <p
          className="uppercase"
          style={{ marginTop: 14, fontSize: 10, letterSpacing: '0.28em', color: ACCENT, opacity: 0.85 }}
        >
          {milestone.date}
        </p>
        <h3 className="font-serif italic" style={{ marginTop: 4, fontSize: 22, color: INK }}>
          {milestone.title}
        </h3>
        <p
          className="font-serif italic"
          style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: INK, opacity: 0.75 }}
        >
          {milestone.caption}
        </p>

        <button
          onClick={onResume}
          className="font-sans"
          style={{
            marginTop: 16,
            width: '100%',
            padding: '10px 0',
            fontSize: 13,
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
