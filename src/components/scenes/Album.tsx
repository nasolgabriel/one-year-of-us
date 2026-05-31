'use client'

import { useRef } from 'react'
import { m, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'

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

// Continuous, scroll-scrubbed peel. `front` is a float = how many cards have been
// consumed (e.g. 2.5 = card 2 is half-peeled). Each card derives its transform from
// `relative = i - front` with zero React re-renders, so it tracks scroll 1:1 — no
// integer-threshold pops (2 at once) and no dead scroll gaps (needs 2 scrolls).
function PeelCard({
  i,
  total,
  front,
  photo,
}: {
  i: number
  total: number
  front: MotionValue<number>
  photo: (typeof PHOTOS)[number]
}) {
  // distance from the front of the stack; <0 means this card is peeling/peeled
  const relative = useTransform(front, (f) => i - f)
  // peel progress 0→1 once it leaves the front (clamped)
  const t = (r: number) => Math.min(1, Math.max(0, -r))
  const exitRot = i % 2 ? 16 : 10

  const x = useTransform(relative, (r) => (r >= 0 ? '0%' : `${t(r) * 128}%`))
  const y = useTransform(relative, (r) => (r >= 0 ? `${r * -7}px` : `${t(r) * -128}%`))
  const rotate = useTransform(relative, (r) =>
    r >= 0 ? photo.rot : photo.rot + t(r) * (exitRot - photo.rot),
  )
  const opacity = useTransform(relative, (r) =>
    r >= 0 ? Math.max(0, 1 - r * 0.08) : Math.max(0, 1 - t(r)),
  )
  const scale = useTransform(relative, (r) =>
    r >= 0 ? Math.max(0.5, 1 - r * 0.03) : 1 - t(r) * 0.08,
  )

  return (
    <m.div
      className="absolute"
      style={{ zIndex: total - i, willChange: 'transform', x, y, rotate, opacity, scale }}
    >
      <Polaroid label={photo.label} />
    </m.div>
  )
}

function PeelAlbum() {
  const ref = useRef<HTMLElement>(null)
  const total = PHOTOS.length

  // Single Lenis-integrated scroll source (same as the other scenes) → consistent
  // on desktop and mobile. A light spring softens the glide without lagging the finger.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })
  // map scroll progress → float card index (all peeled by REMOVE_WINDOW of the track)
  const front = useTransform(smooth, (v) => (v / REMOVE_WINDOW) * total)

  return (
    <section ref={ref} style={{ height: '700vh', position: 'relative', background: P.bg }}>
      <div className="sticky top-0 h-dvh">
        <div className="absolute left-0 right-0 top-[12dvh] flex justify-center px-6">
          <Label>our year, one at a time</Label>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 272, height: 360 }}>
            {PHOTOS.map((photo, i) => (
              <PeelCard key={i} i={i} total={total} front={front} photo={photo} />
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
