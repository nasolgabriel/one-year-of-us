'use client'

// Throwaway demo of the planned lenis.dev-style scroll effects for scenes 3–7.
// Placeholder boxes only (no real assets). Delete when done. Lenis is global.
import { useRef, useState } from 'react'
import { m, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'

// ── Shared ─────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.5 }}>
      {children}
    </span>
  )
}

// Placeholder "photo" — gradient box so we don't ship real images in a demo
function PhotoBox({ label, w = 260, h = 330 }: { label: string; w?: number; h?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg font-sans"
      style={{
        width: w,
        height: h,
        background: 'linear-gradient(135deg, #FFCDD2, #FF8FA4 60%, #E24B6A)',
        boxShadow: '0 18px 40px -12px rgba(0,0,0,0.45)',
        color: '#4B1528',
        fontSize: 13,
        letterSpacing: '0.1em',
        border: '6px solid #FFF5F5',
      }}
    >
      {label}
    </div>
  )
}

// ── 1. Text reveal (Scene 3 / Letter) ───────────────────────────────────────
const LINES = [
  'line one — fades in as you scroll',
  'line two — rises with a spring',
  'line three — staggered after the last',
  'line four — soft blur clears on entry',
]
const reveal = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.12, type: 'spring' as const, stiffness: 260, damping: 28 },
  }),
}

// ── 2. Single image: parallax + clip reveal (Scene 3 photo / Letter) ─────────
function ParallaxImage() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // Image drifts slower than the page — classic parallax
  const y = useTransform(scrollYProgress, [0, 1], ['-18%', '18%'])
  // Box wipes open as it enters view
  const clip = useTransform(scrollYProgress, [0.1, 0.4], ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'])

  return (
    <m.div
      ref={ref}
      style={{ clipPath: clip, width: 300, height: 380, borderRadius: 12, overflow: 'hidden' }}
    >
      <m.div style={{ y, height: '136%' }}>
        <div
          className="flex h-full items-center justify-center font-sans"
          style={{
            background: 'linear-gradient(160deg, #534AB7, #E24B6A 70%, #FAC775)',
            color: '#FFF5F5',
            fontSize: 13,
            letterSpacing: '0.1em',
          }}
        >
          parallax image — drifts on scroll
        </div>
      </m.div>
    </m.div>
  )
}

// ── 3. Stacked images: sticky scrub peel (Scene 5 Album) ─────────────────────
const STACK = [
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

function StackCard({
  i,
  total,
  depth,
  card,
}: {
  i: number
  total: number
  depth: number // distance from front: 0 = front, <0 = already removed
  card: (typeof STACK)[number]
}) {
  // Scroll only TRIGGERS removal; the peel runs at a fixed constant speed.
  // Exit heads north-east (up + right). Cards still in the stack sit at a depth
  // offset (peeked back + scaled down + dimmed); when the one ahead peels, they
  // glide forward with a spring so the stack never feels static/clunky.
  const removed = depth < 0
  return (
    <m.div
      className="absolute"
      style={{ zIndex: total - i }}
      initial={false}
      animate={
        removed
          ? { x: '128%', y: '-128%', rotate: i % 2 ? 16 : 10, opacity: 0, scale: 0.92 }
          : {
              x: 0,
              y: depth * -7,
              rotate: card.rot,
              opacity: Math.max(0, 1 - depth * 0.08),
              scale: 1 - depth * 0.03,
            }
      }
      transition={
        removed
          ? { duration: 0.9, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 220, damping: 26 }
      }
    >
      <PhotoBox label={card.label} />
    </m.div>
  )
}

// All photos are peeled within this fraction of the track; the remaining scroll
// keeps the section pinned (now empty) before it releases → "all gone, then continue".
const REMOVE_WINDOW = 0.82

function StackedPeel() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const total = STACK.length
  // Map scroll progress → how many cards removed. One scroll segment = one card.
  const [removedCount, setRemovedCount] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setRemovedCount(Math.min(total, Math.floor((v / REMOVE_WINDOW) * total + 1e-4)))
  })

  return (
    // Tall track gives scroll room; inner pins (sticky) and the stack stays
    // centred in the viewport while cards peel.
    <section ref={ref} style={{ height: '1000vh', position: 'relative' }}>
      <div className="sticky top-0 h-dvh">
        <div className="absolute left-0 right-0 top-[12dvh] flex justify-center">
          <Label>scroll — photos peel, then the page continues</Label>
        </div>

        {/* Stack — dead-centre of the viewport */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 272, height: 342 }}>
            {STACK.map((card, i) => (
              <StackCard key={i} i={i} total={total} depth={i - removedCount} card={card} />
            ))}
          </div>
        </div>

        <span
          className="absolute bottom-[12dvh] left-0 right-0 text-center font-serif italic"
          style={{ color: '#993556', fontSize: 14 }}
        >
          5 of 10 caught · play again to find the rest
        </span>
      </div>
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
function Section({ fg, children }: { fg: string; children: React.ReactNode }) {
  return (
    <section
      className="flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ color: fg, minHeight: '160dvh' }}
    >
      {children}
    </section>
  )
}

export default function DemoPage() {
  // One fixed backdrop that morphs through the palette as you scroll — no hard
  // section cuts, the scene colour bleeds slowly from one to the next.
  const { scrollYProgress } = useScroll()
  const bg = useTransform(
    scrollYProgress,
    [0, 0.22, 0.45, 0.78, 1],
    ['#141228', '#5C4B8A', '#2A1810', '#FFCDD2', '#FFF5F5'],
  )

  return (
    <main className="relative">
      <m.div className="fixed inset-0 -z-10" style={{ backgroundColor: bg }} aria-hidden />

      <Section fg="#FF8FA4">
        <Label>scroll down ↓</Label>
        <p className="font-serif italic" style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)' }}>
          lenis scroll-effects demo
        </p>
      </Section>

      <Section fg="#FFF5F5">
        <Label>1 · text reveal</Label>
        <div className="flex flex-col gap-5">
          {LINES.map((line, i) => (
            <m.p
              key={i}
              custom={i}
              variants={reveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: false, amount: 0.6 }}
              className="font-serif italic"
              style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)' }}
            >
              {line}
            </m.p>
          ))}
        </div>
      </Section>

      <Section fg="#FAC775">
        <Label>2 · image parallax + clip</Label>
        <ParallaxImage />
      </Section>

      <StackedPeel />

      <Section fg="#2A1810">
        <Label>3 · payoff</Label>
        <m.p
          initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="font-serif italic"
          style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)' }}
        >
          then i saw you…
        </m.p>
      </Section>
    </main>
  )
}
