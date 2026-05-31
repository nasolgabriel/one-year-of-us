'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const P = {
  bg:     '#FFCDD2', // cotton candy ground
  accent: '#993556', // contrast-safe on cotton candy (4.97:1)
  ink:    '#4B1528', // deep wine text
  paper:  '#FFFDF7', // polaroid frame
} as const

const PHOTOS = [
  { label: 'photo 1', rot: -4 },
  { label: 'photo 2', rot: 3 },
  { label: 'photo 3', rot: -2 },
  { label: 'photo 4', rot: 5 },
  { label: 'photo 5', rot: -5 },
  { label: 'photo 6', rot: 2 },
  { label: 'photo 7', rot: -3 },
  { label: 'photo 8', rot: 4 },
  { label: 'photo 9', rot: -1 },
  { label: 'photo 10', rot: 3 },
]

const REMOVE_WINDOW = 0.82

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans uppercase" style={{ color: P.accent, fontSize: 11, letterSpacing: '0.3em', opacity: 0.7 }}>
      {children}
    </span>
  )
}

function Polaroid({ label, rot = 0 }: { label: string; rot?: number }) {
  return (
    <div
      className="font-sans"
      style={{
        background: P.paper,
        padding: '12px 12px 40px',
        borderRadius: 4,
        boxShadow: '0 22px 48px -16px rgba(75,21,40,0.4)',
        transform: `rotate(${rot}deg)`,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 'clamp(208px, 60vw, 248px)',
          height: 'clamp(248px, 72vw, 296px)',
          background: 'linear-gradient(150deg, #534AB7 0%, #E24B6A 65%, #FAC775 100%)',
          color: '#FFF5F5',
          fontSize: 13,
          letterSpacing: '0.16em',
        }}
      >
        {label}
      </div>
      <p className="font-serif italic" style={{ marginTop: 12, textAlign: 'center', color: P.ink, opacity: 0.6, fontSize: 14 }}>
        us ♡
      </p>
    </div>
  )
}

function PeelCard({ i, total, depth, photo }: { i: number; total: number; depth: number; photo: (typeof PHOTOS)[number] }) {
  const removed = depth < 0
  return (
    <motion.div
      className="absolute"
      style={{ zIndex: total - i }}
      initial={false}
      animate={
        removed
          ? { x: '128%', y: '-128%', rotate: i % 2 ? 16 : 10, opacity: 0, scale: 0.92 }
          : { x: 0, y: depth * -7, rotate: photo.rot, opacity: Math.max(0, 1 - depth * 0.08), scale: 1 - depth * 0.03 }
      }
      transition={removed ? { duration: 0.9, ease: 'easeInOut' } : { type: 'spring', stiffness: 220, damping: 26 }}
    >
      <Polaroid label={photo.label} />
    </motion.div>
  )
}

function PeelAlbum() {
  const ref = useRef<HTMLElement>(null)
  const total = PHOTOS.length
  const [removedCount, setRemovedCount] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const span = rect.height - window.innerHeight
      const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0
      setRemovedCount(Math.min(total, Math.floor((p / REMOVE_WINDOW) * total + 1e-4)))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [total])

  return (
    <section ref={ref} style={{ height: '700vh', position: 'relative', background: P.bg }}>
      <div className="sticky top-0 h-dvh">
        <div className="absolute left-0 right-0 top-[12dvh] flex justify-center px-6">
          <Label>our year, one at a time</Label>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 272, height: 360 }}>
            {PHOTOS.map((photo, i) => (
              <PeelCard key={i} i={i} total={total} depth={i - removedCount} photo={photo} />
            ))}
          </div>
        </div>

        <p
          className="absolute bottom-[12dvh] left-0 right-0 px-6 text-center font-serif italic"
          style={{ color: P.accent, fontSize: 15 }}
        >
          Photos save only half of the moment.
        </p>
      </div>
    </section>
  )
}

export default function Album() {
  return <PeelAlbum />
}
