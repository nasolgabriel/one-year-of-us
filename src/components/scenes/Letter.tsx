'use client'

import { useRef } from 'react'
import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import Sophie from '@/components/Sophie'
import { PixelHeartSvg } from '@/components/ui/RideHud'
import { COLORS, UNLOCK_DATE } from '@/lib/constants'

const P = {
  from:     '#FFCDD2',    // Album's ground — the bg morph starts where scene 5 ended
  // Warm sand, not the brief's #FAEEDA cream: the aged sheet is itself a cream, so
  // the ground it lies on has to be darker or the paper has no edge.
  to:       '#E8D3B4',
  paper:    '#F8F0DE',    // aged cream stock
  underlay: '#EFE3CB',
  ink:      '#2A1810',    // 15:1 on paper — same body ink as Hero and BeforeBeginning
  rose:     COLORS.rose,  // 6.2:1 — labels, salutation, signature
  accent:   COLORS.pink,  // decorative rules only, never text
  sealDeep: COLORS.twilight,
} as const

const DATE_LINE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
  .format(UNLOCK_DATE)
  .toLowerCase()

const SALUTATION = 'To My Dearest Babi,'

const PARAGRAPHS = [
  'i have started this letter more times than i can count. every version said the same thing, only clumsier. so here it is, plainly.',
  'you make ordinary days feel like something worth keeping. the way you laugh before you finish the joke. the way you steal the blanket and pretend you did not. the way sophie picks your lap every single time — she knows.',
  'a year ago you were someone i was still learning. now i know the sound of your footsteps, which of your smiles means trouble, and exactly how you take up half the bed.',
  'i used to think love was supposed to be loud. it turns out it is mostly quiet. it is you humming while you get ready. it is something stupid i send you at 2am. it is coming home and finding you already there.',
  'thank you for one year of small, unremarkable, perfect days. they are my favourite ones.',
  'i would ride the whole way again just to get here… and i would like to keep going, if you will have me.',
]

const SIGNOFF = 'happy anniversary, my very sweet and caring Babi.'

// Sized against the 720px sheet so a full line lands at ~73 characters.
const BODY_SIZE = 'clamp(1.04rem, 3.4vw, 1.22rem)'
const BODY_LEADING = 1.55
// Body paragraphs sit on a ruled ground, so the rules and the leading are the same
// value. Paragraphs are indented rather than spaced — a blank line between them
// would push every following line off the ruling.
const RULE_PITCH = `calc(${BODY_SIZE} * ${BODY_LEADING})`
const RULE_INK = 'rgba(120,80,40,0.13)'

function Para({
  text,
  reduced,
  italic,
  i = 0,
}: {
  text: string
  reduced: boolean
  italic?: boolean
  i?: number
}) {
  // The sheet fits one desktop screen, so paragraphs enter together — the index
  // delay is what keeps the cascade the scroll used to provide.
  const delay = i * 0.08
  return (
    <m.p
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(5px)' }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={
        reduced
          ? { duration: 0.35, delay }
          : { delay, type: 'spring', stiffness: 240, damping: 30 }
      }
      className={`text-pretty font-serif${italic ? ' italic' : ''}`}
      style={{
        color: P.ink,
        fontSize: BODY_SIZE,
        lineHeight: BODY_LEADING,
        letterSpacing: '0.008em',
        textIndent: i > 0 ? '1.7em' : 0,
      }}
    >
      {text}
    </m.p>
  )
}

function Crease({ top }: { top: string }) {
  return (
    <i
      className="pointer-events-none absolute left-0 right-0"
      style={{
        top,
        height: 3,
        background:
          'linear-gradient(180deg, rgba(75,21,40,0) 0%, rgba(75,21,40,0.06) 45%, rgba(255,255,255,0.85) 58%, rgba(255,255,255,0) 100%)',
      }}
      aria-hidden
    />
  )
}

function Ornament() {
  const rule = { width: 64, height: 1, background: P.accent } as const
  return (
    <m.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="flex items-center justify-center"
      style={{ gap: 12 }}
      aria-hidden
    >
      <i style={rule} />
      <PixelHeartSvg size={12} color={P.accent} />
      <i style={rule} />
    </m.div>
  )
}

function WaxSeal({ reduced }: { reduced: boolean }) {
  return (
    <m.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.5, rotate: -18 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -7 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={
        reduced ? { duration: 0.35 } : { delay: 0.35, type: 'spring', stiffness: 320, damping: 17 }
      }
      className="flex shrink-0 items-center justify-center"
      style={{
        width: 'clamp(58px, 15vw, 70px)',
        height: 'clamp(58px, 15vw, 70px)',
        // Uneven radii + off-centre highlight read as poured wax, not a UI badge.
        borderRadius: '46% 54% 52% 48% / 50% 46% 54% 50%',
        background: `radial-gradient(120% 120% at 34% 28%, #B14468 0%, ${P.rose} 55%, ${P.sealDeep} 100%)`,
        boxShadow:
          'inset 0 2px 6px rgba(255,255,255,0.30), inset 0 -3px 8px rgba(75,21,40,0.35), 0 3px 8px -2px rgba(75,21,40,0.38)',
      }}
      aria-hidden
    >
      <div style={{ filter: 'drop-shadow(0 1px 0 rgba(75,21,40,0.5))' }}>
        <PixelHeartSvg size={22} color={P.accent} />
      </div>
    </m.div>
  )
}

function Paper({ reduced }: { reduced: boolean }) {
  return (
    <m.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 44 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className="relative"
    >
      {/* Second sheet peeking out — the letter reads as pages, not a single card. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: P.underlay,
          borderRadius: 3,
          transform: 'rotate(1.4deg) translateY(6px)',
          boxShadow: '0 18px 40px -24px rgba(75,21,40,0.4)',
        }}
        aria-hidden
      />

      <article
        className="relative overflow-hidden"
        style={{
          transform: 'rotate(-0.6deg)',
          background: P.paper,
          // Bottom is deep on purpose — Sophie sleeps in it.
          padding: 'clamp(20px, 3.5vw, 32px) clamp(18px, 4.5vw, 46px) clamp(60px, 8vw, 72px)',
          borderRadius: 3,
          boxShadow: [
            '0 1px 1px rgba(75,21,40,0.10)',
            '0 10px 20px -12px rgba(75,21,40,0.22)',
            '0 36px 70px -34px rgba(75,21,40,0.42)',
            'inset 0 0 30px rgba(120,80,40,0.14)',
            'inset 0 0 90px rgba(120,80,40,0.06)',
          ].join(', '),
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'url(/grain.png)',
            backgroundRepeat: 'repeat',
            opacity: 0.045,
          }}
          aria-hidden
        />
        {/* Foxing — the rust-coloured spots aged paper picks up at the edges. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              'radial-gradient(7px 5px at 7% 5%, rgba(140,95,45,0.17), transparent 70%)',
              'radial-gradient(4px 4px at 94% 11%, rgba(140,95,45,0.13), transparent 70%)',
              'radial-gradient(8px 5px at 90% 93%, rgba(140,95,45,0.12), transparent 70%)',
              'radial-gradient(3px 3px at 12% 84%, rgba(140,95,45,0.15), transparent 70%)',
              'radial-gradient(5px 4px at 44% 98%, rgba(140,95,45,0.10), transparent 70%)',
            ].join(', '),
          }}
          aria-hidden
        />
        <Crease top="33.3%" />
        <Crease top="66.6%" />
        <m.p
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(5px)' }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="font-serif italic"
          style={{
            color: P.rose,
            fontSize: 'clamp(1.22rem, 4vw, 1.5rem)',
            lineHeight: 1.2,
            marginBottom: 'clamp(11px, 2.2vw, 15px)',
          }}
        >
          {SALUTATION}
        </m.p>

        <div
          className="flex flex-col"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${RULE_PITCH} - 1px), ${RULE_INK} calc(${RULE_PITCH} - 1px), ${RULE_INK} ${RULE_PITCH})`,
          }}
        >
          {PARAGRAPHS.map((text, i) => (
            <Para key={i} text={text} reduced={reduced} i={i} />
          ))}
        </div>

        <div style={{ margin: 'clamp(17px, 3.2vw, 23px) 0 clamp(13px, 2.6vw, 18px)' }}>
          <Ornament />
        </div>

        <Para text={SIGNOFF} reduced={reduced} italic />

        <m.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 28 }}
          className="flex items-end justify-between"
          style={{ gap: 16, marginTop: 'clamp(15px, 2.8vw, 20px)' }}
        >
          <div>
            <p
              className="font-serif italic"
              style={{ color: P.ink, fontSize: BODY_SIZE, lineHeight: 1.5 }}
            >
              always yours,
            </p>
            <p
              className="font-script"
              style={{
                color: P.rose,
                fontSize: 'clamp(1.85rem, 5.5vw, 2.2rem)',
                lineHeight: 1.15,
                marginTop: 2,
              }}
            >
              Gab
            </p>
          </div>
          <WaxSeal reduced={reduced} />
        </m.div>

        {/* Sits in the paper's deep bottom padding, tucked under the signature row. */}
        <div
          className="absolute"
          style={{ right: 'clamp(10px, 4vw, 24px)', bottom: 'clamp(2px, 1.5vw, 10px)' }}
        >
          <Sophie variant="sleeping" />
        </div>
      </article>
    </m.div>
  )
}

export default function Letter() {
  const reduced = useReducedMotion() ?? false
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const bg = useTransform(scrollYProgress, [0, 0.28, 1], [P.from, P.to, P.to])
  const lift = useTransform(scrollYProgress, [0, 1], [34, -34])

  return (
    <section ref={ref} className="relative overflow-hidden" aria-labelledby="letter-heading">
      <m.div className="absolute inset-0 -z-10" style={{ backgroundColor: bg }} aria-hidden />

      <div className="relative flex min-h-[125dvh] flex-col items-center justify-center px-4 py-14 sm:px-5">
        <m.div className="relative w-full" style={{ maxWidth: 720, y: reduced ? 0 : lift }}>
          <Paper reduced={reduced} />
        </m.div>
      </div>
    </section>
  )
}
