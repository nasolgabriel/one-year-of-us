'use client'

import { useRef } from 'react'
import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import Sophie from '@/components/Sophie'
import { PixelHeartSvg } from '@/components/ui/RideHud'

const P = {
  from:   '#FFCDD2',
  to:     '#FFF8EE',
  paper:  '#FFFDF7',
  ink:    '#2A1810',
  rose:   '#993556',
  pink:   '#F4C0D1',
  honey:  '#FAC775',
} as const

const SALUTATION = 'my dearest rie,'

const STANZAS = [
  [
    'i have started this letter more times than i can count.',
    'every version said the same thing, only clumsier.',
    'so here it is, plainly.',
  ],
  [
    'you make ordinary days feel like something worth keeping.',
    'the way you laugh before you finish the joke.',
    'the way you steal the blanket and pretend you did not.',
    'the way sophie picks your lap every single time — she knows.',
  ],
  [
    'a year ago you were someone i was still learning.',
    'now i know the sound of your footsteps,',
    'which of your smiles means trouble,',
    'and exactly how you take up half the bed.',
  ],
  [
    'i used to think love was supposed to be loud.',
    'it turns out it is mostly quiet.',
    'it is you humming while you get ready.',
    'it is something stupid i send you at 2am.',
    'it is coming home and finding you already there.',
  ],
  [
    'thank you for one year of small, unremarkable, perfect days.',
    'they are my favourite ones.',
  ],
  [
    'i would ride the whole way again just to get here…',
    'and i would like to keep going, if you will have me.',
  ],
]

const SIGNOFF = 'happy anniversary, my love.'

function Line({
  text,
  i,
  reduced,
  size,
  color,
}: {
  text: string
  i: number
  reduced: boolean
  size: string
  color: string
}) {
  return (
    <m.p
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, filter: 'blur(6px)' }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: false, amount: 0.6 }}
      transition={{ delay: i * 0.12, type: 'spring', stiffness: 260, damping: 28 }}
      className="font-serif italic"
      style={{ color, fontSize: size, lineHeight: 1.62, letterSpacing: '0.01em' }}
    >
      {text}
    </m.p>
  )
}

function Ornament() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.75 }}
      viewport={{ once: false, amount: 0.8 }}
      transition={{ duration: 0.9 }}
      className="flex items-center justify-center"
      style={{ gap: 10 }}
      aria-hidden
    >
      <PixelHeartSvg size={9} color={P.pink} />
      <i style={{ width: 42, height: 1, background: P.rose, opacity: 0.35 }} />
      <span style={{ color: P.rose, fontSize: 11, opacity: 0.7 }}>✧</span>
      <i style={{ width: 42, height: 1, background: P.rose, opacity: 0.35 }} />
      <PixelHeartSvg size={9} color={P.pink} />
    </m.div>
  )
}

export default function Letter() {
  const reduced = useReducedMotion() ?? false
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const bg = useTransform(scrollYProgress, [0, 0.22, 0.85, 1], [P.from, P.to, P.to, P.from])

  const body = 'clamp(1.02rem, 3.6vw, 1.28rem)'

  return (
    <section ref={ref} className="relative overflow-hidden">
      <m.div className="absolute inset-0 -z-10" style={{ backgroundColor: bg }} aria-hidden />

      <div className="relative flex min-h-[200dvh] flex-col items-center justify-center px-5 py-24">
        <m.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, rotate: -0.6 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, rotate: -0.6 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          className="relative w-full"
          style={{
            maxWidth: 560,
            background: P.paper,
            padding: 'clamp(30px, 7vw, 58px) clamp(24px, 6vw, 52px) clamp(80px, 14vw, 104px)',
            borderRadius: 3,
            boxShadow: '0 30px 70px -28px rgba(75,21,40,0.34), 0 2px 0 rgba(153,53,86,0.06)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'url(/grain.png)',
              backgroundRepeat: 'repeat',
              opacity: 0.04,
              borderRadius: 3,
            }}
            aria-hidden
          />

          <m.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.6 }}
            viewport={{ once: false, amount: 0.8 }}
            transition={{ duration: 0.8 }}
            className="font-sans uppercase"
            style={{
              display: 'block',
              color: P.rose,
              fontSize: 10,
              letterSpacing: '0.3em',
              marginBottom: 'clamp(20px, 4vw, 30px)',
            }}
          >
            a letter for you
          </m.span>

          <m.p
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(6px)' }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="font-serif italic"
            style={{
              color: P.rose,
              fontSize: 'clamp(1.3rem, 5vw, 1.75rem)',
              lineHeight: 1.3,
              marginBottom: 'clamp(22px, 5vw, 34px)',
            }}
          >
            {SALUTATION}
          </m.p>

          <div className="flex flex-col" style={{ gap: 'clamp(22px, 5vw, 32px)' }}>
            {STANZAS.map((stanza, s) => (
              <div key={s} className="flex flex-col" style={{ gap: 6 }}>
                {stanza.map((line, i) => (
                  <Line key={i} text={line} i={i} reduced={reduced} size={body} color={P.ink} />
                ))}
              </div>
            ))}
          </div>

          <div style={{ margin: 'clamp(34px, 7vw, 46px) 0 clamp(26px, 5vw, 34px)' }}>
            <Ornament />
          </div>

          <Line text={SIGNOFF} i={0} reduced={reduced} size={body} color={P.ink} />

          <m.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 28 }}
            style={{ marginTop: 'clamp(26px, 5vw, 36px)' }}
          >
            <p
              className="font-serif italic"
              style={{ color: P.ink, opacity: 0.62, fontSize: body, lineHeight: 1.5 }}
            >
              always yours,
            </p>
            <p
              className="font-script"
              style={{
                color: P.rose,
                fontSize: 'clamp(2.1rem, 8vw, 2.9rem)',
                lineHeight: 1.15,
                marginTop: 4,
              }}
            >
              gabriel
            </p>
          </m.div>

          <div
            className="absolute"
            style={{ right: 'clamp(12px, 4vw, 26px)', bottom: 'clamp(6px, 2vw, 12px)' }}
          >
            <Sophie variant="sleeping" />
          </div>

          <i
            className="pointer-events-none absolute"
            style={{
              left: 0,
              right: 0,
              bottom: 0,
              height: 3,
              background: `linear-gradient(90deg, ${P.pink}, ${P.honey}, ${P.pink})`,
              opacity: 0.5,
              borderRadius: '0 0 3px 3px',
            }}
            aria-hidden
          />
        </m.div>
      </div>
    </section>
  )
}
