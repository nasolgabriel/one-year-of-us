'use client'

import { motion } from 'framer-motion'
import { UNLOCK_DATE_DISPLAY } from '@/lib/constants'
import type { UnlockState, TimeRemaining } from '@/hooks/useUnlock'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:         '#141228',
  lockBody:   '#1e0d18',
  strawberry: '#E24B6A',
  bubblegum:  '#FF8FA4',
  duskFaint:  'rgba(92,75,138,0.6)',
  haloOuter:  'rgba(226,75,106,0.15)',
  haloMid:    'rgba(226,75,106,0.10)',
  haloInner:  'rgba(226,75,106,0.22)',
  glow:       'radial-gradient(ellipse 58% 42% at 50% 46%, rgba(226,75,106,0.13) 0%, rgba(92,75,138,0.07) 55%, transparent 72%)',
} as const

// ── Deterministic data ───────────────────────────────────────────────────────
const STARS = Array.from({ length: 150 }, (_, i) => ({
  x:       (i * 137.508) % 100,
  y:       (i * 79.317 + i * i * 0.031) % 100,
  size:    0.5 + (i % 3) * 0.55,
  opLo:    0.04 + (i % 8) * 0.045,
  opHi:    Math.min(0.04 + (i % 8) * 0.045 + 0.2 + (i % 5) * 0.07, 0.72),
  dur:     2 + (i % 7) * 0.65,
  delay:   (i * 0.17) % (2 + (i % 7) * 0.65),
}))

const PETAL_COLORS = ['#FF8FA4', '#E24B6A', '#FFCDD2']
const PETALS = Array.from({ length: 28 }, (_, i) => ({
  x:           (i * 51.7 + 7) % 100,
  delay:       (i * 0.13) % 1.4,
  duration:    2.6 + (i % 4) * 0.45,
  size:        8 + (i % 3) * 4,
  rotateStart: (i * 47) % 360,
  rotateEnd:   ((i * 47) % 360) + 200 + (i % 5) * 40,
  swayPx:      25 + (i % 4) * 18,
  hue:         i % 3,
}))

const SPARKLES = Array.from({ length: 14 }, (_, i) => ({
  angle:    ((i * 360) / 14) - 90 + (i % 3) * 8,
  distance: 70 + (i % 3) * 28,
  delay:    0.1 + i * 0.04,
  size:     13 + (i % 3) * 4,
}))

// ── Sub-components ───────────────────────────────────────────────────────────
function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {STARS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [s.opLo, s.opHi, s.opLo] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function PadlockSVG({ unlocking }: { unlocking: boolean }) {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      style={{
        width: 'clamp(72px, 7.2vw, 116px)',
        height: 'auto',
        filter: `drop-shadow(0 0 28px rgba(226,75,106,0.38)) drop-shadow(0 0 8px rgba(226,75,106,0.2))`,
        display: 'block',
        overflow: 'visible',
      }}
      aria-label="padlock"
    >
      <motion.g
        style={{ transformOrigin: '46px 30px', transformBox: 'view-box' }}
        initial={false}
        animate={unlocking ? { rotate: 55, y: -2 } : { rotate: 0, y: 0 }}
        transition={
          unlocking
            ? { duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }
            : { duration: 0.4 }
        }
      >
        <path
          d="M 18 30 V 20 a 14 14 0 0 1 28 0 V 30"
          stroke={C.strawberry} strokeWidth={2.5} strokeLinecap="round" fill="none"
        />
      </motion.g>

      <rect x={9.5} y={28} width={45} height={40} rx={7}
        fill={C.lockBody} stroke={C.strawberry} strokeWidth={2.5} />
      <circle cx={32} cy={44} r={4.2} stroke={C.strawberry} strokeWidth={2.4} fill="none" />
      <rect x={30.8} y={46.5} width={2.4} height={8} rx={1.2} fill={C.strawberry} />
      <path
        d="M 32 60 m -3 -1 c -1.5 -1.5 -3.5 0 -1.5 2 c 0.5 0.5 4.5 4 4.5 4 c 0 0 4 -3.5 4.5 -4 c 2 -2 0 -3.5 -1.5 -2 c -0.7 0.7 -1.7 0.7 -3 0 z"
        fill={C.strawberry} opacity={0.45}
      />
    </svg>
  )
}

function CountdownTile({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl"
      style={{
        background: 'rgba(226,75,106,0.07)',
        border: '1px solid rgba(226,75,106,0.25)',
        minWidth: 'clamp(64px, 6vw, 88px)',
        padding: 'clamp(0.75rem, 1.1vw, 1.1rem) clamp(0.9rem, 1.3vw, 1.5rem)',
        gap: 'clamp(0.35rem, 0.5vw, 0.5rem)',
      }}
    >
      <span
        className="tabular-nums font-semibold leading-none"
        style={{
          fontSize: 'clamp(1.6rem, 2.4vw, 2.4rem)',
          color: C.strawberry,
          letterSpacing: '0.04em',
        }}
      >
        {value}
      </span>
      <span
        className="uppercase leading-none"
        style={{
          fontSize: 'clamp(9px, 0.7vw, 11px)',
          letterSpacing: '0.24em',
          color: 'rgba(226,75,106,0.55)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function HeartSparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {SPARKLES.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180
        const tx = Math.cos(rad) * s.distance
        const ty = Math.sin(rad) * s.distance
        return (
          <motion.span
            key={i}
            className="absolute leading-none"
            style={{ fontSize: s.size, color: C.bubblegum, textShadow: `0 0 10px rgba(255,143,164,0.7)` }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: [0, tx], y: [0, ty - 18], opacity: [0, 1, 0], scale: [0, 1.15, 0.5] }}
            transition={{ duration: 1.4, delay: s.delay, ease: 'easeOut', times: [0, 0.4, 1] }}
          >
            ♥
          </motion.span>
        )
      })}
    </div>
  )
}

function Petals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALS.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${p.x}%`, top: '-30px' }}
          initial={{ y: -30, opacity: 0, rotate: p.rotateStart, x: 0 }}
          animate={{
            y: ['-30px', '110vh'],
            opacity: [0, 0.85, 0.85, 0],
            rotate: [p.rotateStart, p.rotateEnd],
            x: [0, p.swayPx, -p.swayPx, p.swayPx * 0.5, 0],
          }}
          transition={{
            duration: p.duration, delay: 0.3 + p.delay, ease: 'linear',
            opacity: { times: [0, 0.1, 0.85, 1] },
            x: { times: [0, 0.25, 0.5, 0.75, 1] },
          }}
        >
          <svg width={p.size} height={p.size * 1.5} viewBox="0 0 12 18">
            <path d="M 6 0 C 10 4 12 9 6 18 C 0 9 2 4 6 0 z" fill={PETAL_COLORS[p.hue]} opacity={0.85} />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}

// ── Scene ────────────────────────────────────────────────────────────────────
interface Props {
  state: UnlockState
  timeRemaining: TimeRemaining
}

export default function LockedHero({ state, timeRemaining }: Props) {
  const unlocking = state === 'unlocking'
  const { days, hours, minutes, seconds } = timeRemaining

  return (
    <motion.section
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: C.bg }}
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.06,
        filter: 'blur(8px)',
        transition: { duration: 1, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      <Starfield />

      {/* Strawberry center glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: C.glow }}
        aria-hidden
      />

      {/* Top shade — pulls eye to center */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0"
        style={{ height: '220px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)' }}
        aria-hidden
      />

      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 105% 85% at 50% 50%, transparent 42%, rgba(0,0,0,0.52) 100%)' }}
        aria-hidden
      />

      {unlocking && <Petals />}

      {/* ── Main content ── */}
      <div
        className="relative z-10 flex flex-col items-center px-6 text-center"
        style={{ gap: 'clamp(1.75rem, 3vw, 2.75rem)' }}
      >
        {/* Lock + halos */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={
            unlocking
              ? { scale: [1, 1.08, 1.4], opacity: [1, 1, 0], y: [0, -6, -34] }
              : { scale: 1, opacity: 1 }
          }
          transition={
            unlocking
              ? { duration: 1.8, delay: 0.6, times: [0, 0.3, 1], ease: 'easeOut' }
              : { delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {/* Outer halo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.div
              className="rounded-full"
              style={{ width: 'clamp(180px, 17vw, 280px)', height: 'clamp(180px, 17vw, 280px)', border: `1px solid ${C.haloOuter}` }}
              animate={
                unlocking
                  ? { scale: 2.2, opacity: 0 }
                  : { scale: [1, 1.14, 1], opacity: [0.65, 0.2, 0.65] }
              }
              transition={unlocking ? { duration: 1.4, ease: 'easeOut' } : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
          </div>

          {/* Mid halo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.div
              className="rounded-full"
              style={{ width: 'clamp(130px, 12.5vw, 205px)', height: 'clamp(130px, 12.5vw, 205px)', border: `1px solid ${C.haloMid}` }}
              animate={
                unlocking
                  ? { scale: 2, opacity: 0 }
                  : { scale: [1.06, 1, 1.06], opacity: [0.5, 0.18, 0.5] }
              }
              transition={unlocking ? { duration: 1.2, delay: 0.1, ease: 'easeOut' } : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: -0.8 }}
              aria-hidden
            />
          </div>

          {/* Inner halo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.div
              className="rounded-full"
              style={{ width: 'clamp(85px, 8vw, 135px)', height: 'clamp(85px, 8vw, 135px)', border: `1px solid ${C.haloInner}` }}
              animate={
                unlocking
                  ? { scale: 2, opacity: 0 }
                  : { scale: [1, 1.1, 1], opacity: [0.7, 0.35, 0.7] }
              }
              transition={unlocking ? { duration: 1.2, delay: 0.2, ease: 'easeOut' } : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: -1.6 }}
              aria-hidden
            />
          </div>

          {unlocking && <HeartSparkles />}

          <motion.div
            animate={unlocking ? {} : { scale: [1, 1.035, 1] }}
            transition={unlocking ? {} : { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PadlockSVG unlocking={unlocking} />
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={unlocking ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
          transition={unlocking ? { duration: 0.55, delay: 0.4 } : { delay: 0.85, duration: 1 }}
          className="font-serif italic leading-relaxed"
          style={{ fontSize: 'clamp(1.125rem, 1.6vw, 1.625rem)', letterSpacing: '0.01em', color: C.bubblegum }}
        >
          something awaits for you…
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={unlocking ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
          transition={unlocking ? { duration: 0.55, delay: 0.5 } : { delay: 1.2, duration: 1 }}
        >
          <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 1vw, 1rem)' }}>
            <CountdownTile value={pad(days)}    label="days" />
            <CountdownTile value={pad(hours)}   label="hrs"  />
            <CountdownTile value={pad(minutes)} label="min"  />
            <CountdownTile value={pad(seconds)} label="sec"  />
          </div>
        </motion.div>

        {/* Date hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={unlocking ? { opacity: 0 } : { opacity: 1 }}
          transition={unlocking ? { duration: 0.4, delay: 0.3 } : { delay: 1.55, duration: 1 }}
          className="font-serif italic"
          style={{ fontSize: 'clamp(0.875rem, 1.05vw, 1.05rem)', letterSpacing: '0.02em', color: 'rgba(255,143,164,0.55)' }}
        >
          unlocks at midnight&ensp;·&ensp;{UNLOCK_DATE_DISPLAY}
        </motion.p>
      </div>

      {/* Scroll locked — bottom */}
      <motion.div
        className="absolute left-0 right-0 flex justify-center"
        style={{ bottom: 'clamp(1.75rem, 3vh, 3rem)' }}
        initial={{ opacity: 0 }}
        animate={unlocking ? { opacity: 0 } : { opacity: 1 }}
        transition={unlocking ? { duration: 0.4 } : { delay: 2, duration: 1 }}
        aria-live="polite"
      >
        <p
          className="uppercase"
          style={{ fontSize: 'clamp(9px, 0.7vw, 11px)', letterSpacing: '0.3em', color: C.duskFaint }}
        >
          scroll is locked&ensp;✕
        </p>
      </motion.div>
    </motion.section>
  )
}
