'use client'

import { useRef, useState, useEffect } from 'react'
import { m, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useLenis } from 'lenis/react'

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

// ── Desktop: continuous, scroll-scrubbed peel ────────────────────────────────
// `front` is a float = how many cards have been consumed (e.g. 2.5 = card 2 is
// half-peeled). Each card derives its transform from `relative = i - front` with
// zero React re-renders, so it tracks scroll 1:1 — no integer-threshold pops.
function ScrubCard({
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

function ScrubAlbum() {
  const ref = useRef<HTMLElement>(null)
  const total = PHOTOS.length

  // Single Lenis-integrated scroll source (same as the other scenes) → consistent.
  // A light spring softens the glide without lagging the finger.
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
              <ScrubCard key={i} i={i} total={total} front={front} photo={photo} />
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

// ── Mobile: discrete, gesture-stepped peel ───────────────────────────────────
// Each card is index-driven (not scroll-driven). `index` = how many are peeled.
function SwipeCard({
  i,
  total,
  index,
  photo,
}: {
  i: number
  total: number
  index: number
  photo: (typeof PHOTOS)[number]
}) {
  const depth = i - index
  const removed = depth < 0
  return (
    <m.div
      className="absolute"
      style={{ zIndex: total - i, willChange: 'transform' }}
      initial={false}
      animate={
        removed
          ? { x: '128%', y: '-128%', rotate: i % 2 ? 16 : 10, opacity: 0, scale: 0.92 }
          : { x: 0, y: depth * -7, rotate: photo.rot, opacity: Math.max(0, 1 - depth * 0.08), scale: 1 - depth * 0.03 }
      }
      transition={removed ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] } : { type: 'spring', stiffness: 260, damping: 28 }}
    >
      <Polaroid label={photo.label} />
    </m.div>
  )
}

const SWIPE_THRESHOLD = 36 // px of vertical travel to count as one step

function SwipeAlbum() {
  const sectionRef = useRef<HTMLElement>(null)
  const total = PHOTOS.length
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  const lenis = useLenis()
  const engagedRef = useRef(false)
  const cooldownRef = useRef(false)
  const startY = useRef(0)
  const startX = useRef(0)

  const lock = () => {
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  }
  const unlock = () => {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    lenis?.start()
  }

  // Engage (pin + lock) once the section fully fills the viewport, so the stack is
  // centered and the page can't be flung past it until every card is peeled.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    let raf = 0
    const check = () => {
      raf = 0
      if (engagedRef.current || cooldownRef.current) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      if (r.top <= 1 && r.bottom >= vh - 1) {
        engagedRef.current = true
        lock()
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
      unlock()
    }
  }, [])

  // Release the lock at a boundary and scroll the page just past the section so the
  // next/previous scene takes over. `dir` +1 = leave downward, -1 = leave upward.
  const release = (dir: 1 | -1) => {
    const el = sectionRef.current
    if (!el) return
    engagedRef.current = false
    cooldownRef.current = true
    unlock()
    const top = window.scrollY + el.getBoundingClientRect().top
    const vh = window.innerHeight
    // Move the page fully past the section so the next/previous scene takes over.
    const target = dir > 0 ? top + el.offsetHeight : top - vh
    if (lenis) lenis.scrollTo(target, { immediate: true })
    else window.scrollTo(0, target)
    window.setTimeout(() => {
      cooldownRef.current = false
    }, 450)
  }

  // Touch handling: one vertical swipe = exactly one step, velocity ignored.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      startY.current = t.clientY
      startX.current = t.clientX
    }
    const onMove = (e: TouchEvent) => {
      if (!engagedRef.current) return
      const t = e.touches[0]
      const dy = t.clientY - startY.current
      const dx = t.clientX - startX.current
      // Block native scroll for vertical gestures; let horizontal ones pass.
      if (Math.abs(dy) > Math.abs(dx)) e.preventDefault()
    }
    const onEnd = (e: TouchEvent) => {
      if (!engagedRef.current) return
      const t = e.changedTouches[0]
      const dy = t.clientY - startY.current
      const dx = t.clientX - startX.current
      if (Math.abs(dx) > Math.abs(dy) || Math.abs(dy) < SWIPE_THRESHOLD) return
      const idx = indexRef.current
      if (dy < 0) {
        // swipe up → next photo, or leave downward if the stack is empty
        if (idx < total) setIndex(idx + 1)
        else release(1)
      } else {
        // swipe down → previous photo, or leave upward if at the start
        if (idx > 0) setIndex(idx - 1)
        else release(-1)
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [total])

  const done = index >= total

  return (
    <section ref={sectionRef} style={{ height: '100dvh', position: 'relative', background: P.bg }}>
      <div className="absolute left-0 right-0 top-[12dvh] flex justify-center px-6">
        <Label>our year, one at a time</Label>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: 272, height: 360 }}>
          {PHOTOS.map((photo, i) => (
            <SwipeCard key={i} i={i} total={total} index={index} photo={photo} />
          ))}
        </div>
      </div>

      <p
        className="absolute bottom-[12dvh] left-0 right-0 px-6 text-center font-serif italic"
        style={{ color: P.accent, fontSize: 15 }}
      >
        {done ? 'Photos save only half of the moment.' : `swipe ↑ · ${index} / ${total}`}
      </p>
    </section>
  )
}

// Touch devices get the locked one-swipe-one-photo carousel; everything else
// (mouse/trackpad) keeps the continuous scroll-scrub.
function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const update = () => setCoarse(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return coarse
}

export default function Album() {
  const coarse = useCoarsePointer()
  return coarse ? <SwipeAlbum /> : <ScrubAlbum />
}
