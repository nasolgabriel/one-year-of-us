'use client'

import { useRef, useState, useEffect } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import { RELATIONSHIP_START } from '@/lib/constants'
import Sophie from '@/components/Sophie'

const P = {
  dusk:  '#2A1810',
  ember: '#C75B2F',
  peach: '#F0997B',
  honey: '#FAC775',
  cream: '#FFF8EE',
} as const

// ── Pixel art heart (7×7 grid) ───────────────────────────────────────────────
function PixelHeart({ size = 12, color = P.ember }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 7 7"
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
      aria-hidden
    >
      <rect x="1" y="0" width="2" height="1" fill={color} />
      <rect x="4" y="0" width="2" height="1" fill={color} />
      <rect x="0" y="1" width="7" height="1" fill={color} />
      <rect x="0" y="2" width="7" height="1" fill={color} />
      <rect x="0" y="3" width="7" height="1" fill={color} />
      <rect x="1" y="4" width="5" height="1" fill={color} />
      <rect x="2" y="5" width="3" height="1" fill={color} />
      <rect x="3" y="6" width="1" height="1" fill={color} />
    </svg>
  )
}

// ── Deterministic ambient data ────────────────────────────────────────────────
const HEARTS = Array.from({ length: 14 }, (_, i) => ({
  x:          (i * 71.3 + 5) % 88 + 6,
  size:        7 + (i % 4) * 3,
  maxOpacity:  0.13 + (i % 5) * 0.05,
  duration:   10 + (i % 5) * 3.5,
  delay:       i < 6 ? i * 0.6 : (i * 1.3) % 8,
  drift:       (i % 3 - 1) * 30,
}))

const PIXEL_SPARKLES = Array.from({ length: 14 }, (_, i) => ({
  x:        (i * 53.7 + 8) % 90 + 5,
  y:        (i * 37.2 + 15) % 84 + 8,
  size:      5 + (i % 3) * 2,
  delay:    (i * 0.55) % 3.5,
  duration:  2.5 + (i % 4) * 0.8,
  warm:      i % 3 !== 2,
}))

const BG_HEARTS = [
  { x: 7,  y: 12, size: 12 },
  { x: 88, y: 22, size: 10 },
  { x: 13, y: 62, size: 14 },
  { x: 84, y: 68, size: 12 },
  { x: 46, y: 6,  size: 10 },
  { x: 52, y: 86, size: 12 },
]

// ── Counter hook ──────────────────────────────────────────────────────────────
function useSinceCounter() {
  const [since, setSince] = useState({ days: 0, hours: 0, minutes: 0 })
  useEffect(() => {
    function calc() {
      const diff = Date.now() - RELATIONSHIP_START.getTime()
      if (diff <= 0) return
      const totalMin = Math.floor(diff / 60_000)
      const hours    = Math.floor(totalMin / 60)
      setSince({ days: Math.floor(hours / 24), hours: hours % 24, minutes: totalMin % 60 })
    }
    calc()
    const id = setInterval(calc, 60_000)
    return () => clearInterval(id)
  }, [])
  return since
}

// ── Ambient layers ────────────────────────────────────────────────────────────
function FloatingHearts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {HEARTS.map((h, i) => (
        <m.span
          key={i}
          className="absolute select-none leading-none"
          style={{ left: `${h.x}%`, top: 0, fontSize: h.size, color: P.ember }}
          animate={{ y: [950, -60], x: [0, h.drift], opacity: [0, h.maxOpacity, h.maxOpacity, 0] }}
          transition={{
            duration: h.duration, delay: h.delay, repeat: Infinity, ease: 'linear',
            opacity: { times: [0, 0.07, 0.88, 1] },
          }}
        >
          ♡
        </m.span>
      ))}
    </div>
  )
}

function PixelSparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PIXEL_SPARKLES.map((s, i) => (
        <m.div
          key={i}
          className="absolute"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.03, 0.38, 0.03], scale: [0.7, 1.15, 0.7] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 5 5" style={{ imageRendering: 'pixelated' }}>
            <rect x="2" y="0" width="1" height="5" fill={s.warm ? P.honey : P.peach} />
            <rect x="0" y="2" width="5" height="1" fill={s.warm ? P.honey : P.peach} />
          </svg>
        </m.div>
      ))}
    </div>
  )
}

function BgPixelHearts() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {BG_HEARTS.map((h, i) => (
        <m.div
          key={i}
          className="absolute"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
          animate={{ opacity: [0.05, 0.14, 0.05] }}
          transition={{ duration: 6 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        >
          <PixelHeart size={h.size} color={P.ember} />
        </m.div>
      ))}
    </div>
  )
}

// ── Decorative corners ────────────────────────────────────────────────────────
function BotanicalCornerTR() {
  return (
    <div className="pointer-events-none absolute top-5 right-5" aria-hidden>
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" opacity="0.32">
        <path d="M 78 8 Q 55 30 28 76" stroke={P.honey} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M 60 22 Q 74 12 80 24 Q 66 30 60 22z" fill={P.peach} />
        <path d="M 46 38 Q 32 24 42 16 Q 52 28 46 38z" fill={P.honey} opacity="0.8" />
        <path d="M 34 55 Q 20 46 28 36 Q 40 44 34 55z" fill={P.peach} opacity="0.65" />
        <circle cx="78" cy="8" r="3.5" fill={P.ember} opacity="0.55" />
        <circle cx="78" cy="8" r="1.8" fill={P.honey} opacity="0.9" />
      </svg>
    </div>
  )
}

function BotanicalCornerBL() {
  return (
    <div className="pointer-events-none absolute bottom-16 left-4" aria-hidden>
      <svg width="90" height="80" viewBox="0 0 90 80" fill="none" opacity="0.28">
        <path d="M 12 72 Q 38 44 64 8" stroke={P.honey} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M 22 58 Q 7 50 12 38 Q 26 46 22 58z" fill={P.peach} />
        <path d="M 40 40 Q 26 26 36 17 Q 48 28 40 40z" fill={P.honey} opacity="0.8" />
        <path d="M 56 20 Q 46 8 56 2 Q 64 12 56 20z" fill={P.peach} opacity="0.65" />
        <circle cx="64" cy="8" r="3.5" fill={P.ember} opacity="0.5" />
        <circle cx="64" cy="8" r="1.8" fill={P.honey} opacity="0.85" />
      </svg>
    </div>
  )
}

// ── Content components ────────────────────────────────────────────────────────
function Ornament() {
  return (
    <div className="flex items-center" style={{ gap: 8 }} aria-hidden>
      <PixelHeart size={10} color={P.honey} />
      <svg width="110" height="16" viewBox="0 0 110 16" fill="none">
        <line x1="0" y1="8" x2="42" y2="8" stroke={P.honey} strokeWidth="0.75" opacity="0.45" />
        <path d="M 55 3 L 60 8 L 55 13 L 50 8 Z" fill={P.honey} opacity="0.65" />
        <path d="M 55 5 L 59 8 L 55 11 L 51 8 Z" fill={P.ember} opacity="0.35" />
        <line x1="68" y1="8" x2="110" y2="8" stroke={P.honey} strokeWidth="0.75" opacity="0.45" />
      </svg>
      <PixelHeart size={10} color={P.honey} />
    </div>
  )
}

function TogetherBadge() {
  return (
    <div
      className="relative flex items-center"
      style={{
        gap: '10px',
        padding: '10px 22px 11px',
        background: 'rgba(250,199,117,0.07)',
        border: '1px dashed rgba(250,199,117,0.42)',
        borderRadius: '2px',
      }}
    >
      <div style={{ position: 'absolute', width: 5, height: 5, background: P.honey, opacity: 0.65, top: -2,  left: -2  }} />
      <div style={{ position: 'absolute', width: 5, height: 5, background: P.honey, opacity: 0.65, top: -2,  right: -2 }} />
      <div style={{ position: 'absolute', width: 5, height: 5, background: P.honey, opacity: 0.65, bottom: -2, left: -2  }} />
      <div style={{ position: 'absolute', width: 5, height: 5, background: P.honey, opacity: 0.65, bottom: -2, right: -2 }} />

      <PixelHeart size={11} color={P.ember} />
      <span
        className="font-serif italic"
        style={{
          fontSize: 'clamp(1rem, 2.2vw, 1.35rem)',
          color: P.dusk,
          letterSpacing: '0.06em',
          lineHeight: 1,
          opacity: 0.82,
        }}
      >
        together and counting
      </span>
      <PixelHeart size={11} color={P.ember} />
    </div>
  )
}

function CounterPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="tabular-nums font-serif leading-none"
        style={{ fontSize: 'clamp(3rem, 6.5vw, 5rem)', color: P.dusk, letterSpacing: '-0.03em', fontWeight: 400 }}
      >
        {value}
      </span>
      <span
        className="font-sans uppercase"
        style={{ fontSize: 'clamp(8px, 0.7vw, 10px)', letterSpacing: '0.28em', color: P.peach, opacity: 0.85 }}
      >
        {label}
      </span>
    </div>
  )
}


// ── Click heart burst ─────────────────────────────────────────────────────────
type Burst = { id: number; x: number; y: number }

const BURST_PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i * (360 / 16) + (i % 3) * 14 - 90) * (Math.PI / 180)
  const dist  = 45 + (i % 5) * 22
  return {
    tx:     Math.cos(angle) * dist,
    ty:     Math.sin(angle) * dist,
    floatY: 110 + (i % 4) * 40,
    floatX: ((i % 3) - 1) * 30,
    size:   14 + (i % 4) * 6,
    delay:  i * 0.035,
    color:  i % 3 === 0 ? P.honey : i % 3 === 1 ? P.ember : P.peach,
  }
})

function HeartBurst({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left: x, top: y }}
      aria-hidden
    >
      {BURST_PARTICLES.map((p, i) => (
        <m.span
          key={i}
          className="absolute select-none leading-none"
          style={{ fontSize: p.size, color: p.color }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: [0, p.tx, p.tx + p.floatX],
            y: [0, p.ty, p.ty - p.floatY],
            opacity: [0, 1, 0.85, 0],
            scale:   [0, 1.4, 1.1, 0.4],
          }}
          transition={{
            duration: 2.4,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.25, 0.65, 1],
            opacity: { times: [0, 0.15, 0.6, 1] },
          }}
        >
          ♡
        </m.span>
      ))}
    </div>
  )
}

// ── Variants — spring physics ─────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      type: 'spring' as const,
      stiffness: 260,
      damping: 28,
    },
  }),
}

// ── Scene ─────────────────────────────────────────────────────────────────────
export default function Hero() {
  const { days, hours, minutes } = useSinceCounter()
  const ref = useRef<HTMLElement>(null)
  const [bursts, setBursts] = useState<Burst[]>([])

  function handleClick(e: React.MouseEvent<HTMLElement>) {
    if ((e.nativeEvent as PointerEvent).pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    const id   = Date.now()
    setBursts(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 2800)
  }

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY            = useTransform(scrollYProgress, [0, 1], ['0%',  '12%'])
  const contentY       = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const scrollHintOp   = useTransform(scrollYProgress, [0, 0.2],  [1, 0])

  return (
    <section
      ref={ref}
      className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden px-6"
      onClick={handleClick}
    >
      {/* Background */}
      <m.div
        className="absolute inset-x-0"
        style={{
          y: bgY, top: '-10%', height: '120%',
          background: `linear-gradient(175deg, ${P.cream} 0%, #FEF0DC 60%, #FDDFC8 100%)`,
        }}
        aria-hidden
      />

      {/* Vignette edges */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 40% at 50% 0%, rgba(42,24,16,0.06) 0%, transparent 100%),
            radial-gradient(ellipse 90% 30% at 50% 100%, rgba(42,24,16,0.05) 0%, transparent 100%)
          `,
        }}
        aria-hidden
      />

      {/* Warm glow behind title */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(520px, 95vw)',
          height: 'min(280px, 55vw)',
          background: `radial-gradient(ellipse at center, rgba(250,199,117,0.28) 0%, rgba(240,153,123,0.12) 45%, transparent 72%)`,
          filter: 'blur(18px)',
        }}
        aria-hidden
      />

      {/* Center radial ambient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(250,199,117,0.20) 0%, transparent 68%)' }}
        aria-hidden
      />

      {/* Grain texture — baked PNG tile, cheaper than a live feTurbulence filter */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'url(/grain.png)',
          backgroundRepeat: 'repeat',
          opacity: 0.032,
          mixBlendMode: 'overlay',
        }}
        aria-hidden
      />

      <PixelSparkles />
      <BgPixelHearts />
      <FloatingHearts />
      <BotanicalCornerTR />
      <BotanicalCornerBL />

      <m.div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ gap: 'clamp(0.5rem, 1.4vw, 0.9rem)', y: contentY, opacity: contentOpacity }}
      >
        <m.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <Ornament />
        </m.div>

        {/* Title — Great Vibes script */}
        <m.h1
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: 'clamp(3rem, 9.5vw, 7rem)',
            color: P.dusk,
            lineHeight: 1.08,
            letterSpacing: '0.01em',
          }}
        >
          one year of us
        </m.h1>

        {/* Subtitle */}
        <m.p
          custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="font-serif italic"
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.45rem)',
            color: P.ember,
            letterSpacing: '0.04em',
            opacity: 0.92,
          }}
        >
          for Rie ♡
        </m.p>

        {/* Thin rule */}
        <m.div
          custom={2.5} variants={fadeUp} initial="hidden" animate="show"
          style={{ width: 'clamp(40px, 8vw, 72px)', height: 1, background: `linear-gradient(to right, transparent, ${P.honey}, transparent)`, opacity: 0.45 }}
          aria-hidden
        />

        {/* Counter */}
        <m.div
          custom={3} variants={fadeUp} initial="hidden" animate="show"
          className="flex items-end"
          style={{ gap: 'clamp(1.25rem, 3.5vw, 2.75rem)', marginTop: 'clamp(0.5rem, 1.5vw, 1.2rem)' }}
        >
          <CounterPill value={days} label="days" />
          <div className="flex flex-col items-center pb-3 gap-1" style={{ opacity: 0.55 }} aria-hidden>
            <PixelHeart size={8} color={P.honey} />
            <PixelHeart size={8} color={P.honey} />
          </div>
          <CounterPill value={hours} label="hours" />
          <div className="flex flex-col items-center pb-3 gap-1" style={{ opacity: 0.55 }} aria-hidden>
            <PixelHeart size={8} color={P.honey} />
            <PixelHeart size={8} color={P.honey} />
          </div>
          <CounterPill value={minutes} label="min" />
        </m.div>

        <m.div
          custom={4} variants={fadeUp} initial="hidden" animate="show"
          style={{ marginTop: 'clamp(0.4rem, 1vw, 0.75rem)' }}
        >
          <TogetherBadge />
        </m.div>
      </m.div>

      <Sophie variant="sleeping" className="absolute bottom-6 right-4 origin-bottom-right scale-[0.62]" />

      {bursts.map(b => <HeartBurst key={b.id} x={b.x} y={b.y} />)}

      {/* Scroll hint */}
      <m.div
        className="absolute bottom-7 left-0 right-0 z-10 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1.2 }}
        style={{ opacity: scrollHintOp }}
      >
        <m.span
          style={{ color: P.honey, fontSize: '1.1rem', lineHeight: 1, display: 'block' }}
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          ↓
        </m.span>
      </m.div>
    </section>
  )
}
