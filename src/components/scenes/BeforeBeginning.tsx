'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion'

const FIRST_PHOTO_URL =
  'https://zqsrakftmkmiijcwbpdr.supabase.co/storage/v1/object/public/photos/IMG_6.jpg'

const FILM_FILTER = 'saturate(0.8) contrast(1.05) brightness(1.05) sepia(0.15)'
const FILM_OVERLAY =
  'linear-gradient(rgba(112,140,190,0.14), rgba(112,140,190,0.14)), radial-gradient(ellipse at center, rgba(255,255,255,0) 55%, rgba(40,20,35,0.25) 100%)'

const P = {
  dusk:   '#5C4B8A', // Part A ground (night-leaning)
  cream:  '#FFF5F5', // Part B ground (day)
  cotton: '#FFCDD2', // light label on dusk
  rose:   '#993556', // contrast-safe accent on cream (4.97:1)
  ink:    '#2A1810', // warm-brown body text on cream
  paper:  '#FFFDF7', // polaroid frame
} as const

const PART_A = [
  'before you, my days were quieter…',
  'i thought i knew what love meant.',
  'i had no idea.',
]
const PART_B = [
  'then i saw you…',
  'and everything made sense.',
  'and so the ride began…',
]

function StoryLine({
  text,
  i,
  color,
  reduced,
}: {
  text: string
  i: number
  color: string
  reduced: boolean
}) {
  return (
    <m.p
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, filter: 'blur(6px)' }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: false, amount: 0.7 }}
      transition={{ delay: i * 0.12, type: 'spring', stiffness: 260, damping: 28 }}
      className="font-serif italic"
      style={{ color, fontSize: 'clamp(1.35rem, 5vw, 2.4rem)', lineHeight: 1.4, letterSpacing: '0.01em' }}
    >
      {text}
    </m.p>
  )
}

function Label({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <m.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.65 }}
      viewport={{ once: false, amount: 0.8 }}
      transition={{ duration: 0.8 }}
      className="font-sans uppercase"
      style={{ color, fontSize: 11, letterSpacing: '0.3em' }}
    >
      {children}
    </m.span>
  )
}

function Polaroid({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-16%', '16%'])
  const clip = useTransform(
    scrollYProgress,
    [0.12, 0.4],
    ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'],
  )

  return (
    <m.div
      initial={{ opacity: 0, rotate: -3, scale: 0.96 }}
      whileInView={{ opacity: 1, rotate: -3, scale: 1 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      style={{
        background: P.paper,
        padding: '12px 12px 44px',
        borderRadius: 4,
        boxShadow: '0 22px 48px -16px rgba(75,21,40,0.35)',
      }}
    >
      <m.div
        ref={ref}
        style={{
          width: 'clamp(220px, 64vw, 300px)',
          height: 'clamp(264px, 76vw, 360px)',
          overflow: 'hidden',
          clipPath: reduced ? undefined : clip,
        }}
      >
        <m.div style={{ y: reduced ? 0 : y, height: '132%', position: 'relative' }}>
          <Image
            src={FIRST_PHOTO_URL}
            alt="our first photo"
            fill
            sizes="300px"
            style={{ objectFit: 'cover', filter: FILM_FILTER }}
          />
          <div className="absolute inset-0" style={{ background: FILM_OVERLAY, pointerEvents: 'none' }} />
        </m.div>
      </m.div>
      <p
        className="font-serif italic"
        style={{ marginTop: 14, textAlign: 'center', color: P.ink, opacity: 0.7, fontSize: 15 }}
      >
        us ♡
      </p>
    </m.div>
  )
}

export default function BeforeBeginning() {
  const reduced = useReducedMotion() ?? false
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const bg = useTransform(scrollYProgress, [0, 0.4, 0.62, 1], [P.dusk, P.dusk, P.cream, P.cream])

  return (
    <section ref={ref} className="relative overflow-hidden">
      <m.div className="absolute inset-0 -z-10" style={{ backgroundColor: bg }} aria-hidden />

      <div className="relative flex min-h-[160dvh] flex-col items-center justify-center gap-7 px-6 text-center">
        <Label color={P.cotton}>part a · before</Label>
        <div className="flex flex-col gap-6">
          {PART_A.map((line, i) => (
            <StoryLine key={i} text={line} i={i} color={P.cream} reduced={reduced} />
          ))}
        </div>
      </div>

      <div className="relative flex min-h-[45dvh] items-center justify-center px-6">
        <m.p
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="font-serif italic"
          style={{ color: P.rose, fontSize: 'clamp(1.2rem, 4vw, 1.9rem)', letterSpacing: '0.08em' }}
        >
          ✧ dawn breaks ✧
        </m.p>
      </div>

      <div className="relative flex min-h-[170dvh] flex-col items-center justify-center gap-10 px-6 text-center">
        <Label color={P.rose}>part b · beginning</Label>
        <StoryLine text={PART_B[0]} i={0} color={P.ink} reduced={reduced} />
        <Polaroid reduced={reduced} />
        <div className="flex flex-col gap-6">
          {PART_B.slice(1).map((line, i) => (
            <StoryLine key={i} text={line} i={i} color={P.ink} reduced={reduced} />
          ))}
        </div>
      </div>
    </section>
  )
}
