'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { useLenis } from 'lenis/react'
import MemoryCard from '@/components/ui/MemoryCard'
import RideHud, { HudChip } from '@/components/ui/RideHud'
import { TIMELINE } from '@/game/config'
import { MILESTONES } from '@/game/milestones'
import type { GameHandle, MilestoneDef } from '@/game/types'

const P = {
  bg: '#97C459',
  ink: '#1A1A2E',
  cream: '#FAEEDA',
  wine: '#4B1528',
} as const

const MS_POSITIONS = MILESTONES.map((def) => (def.distance / TIMELINE.finish) * 100)

// Scene 4 — the pixel bike ride. The kaplay game boots lazily when the section
// approaches the viewport; page scroll locks while riding (same lock/release
// pattern as the Album swipe carousel) and releases on finish or skip.
export default function TheRide() {
  const sectionRef = useRef<HTMLElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const handleRef = useRef<GameHandle | null>(null)
  const lenis = useLenis()

  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [milestone, setMilestone] = useState<MilestoneDef | null>(null)
  const [distance, setDistance] = useState(0)
  const [hearts, setHearts] = useState(0)
  const [inPickup, setInPickup] = useState(false)
  const [sophieAboard, setSophieAboard] = useState(false)
  const [hopped, setHopped] = useState(false)

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

  // Boot the game once the section is within a viewport of scrolling in.
  useEffect(() => {
    const section = sectionRef.current
    const holder = holderRef.current
    if (!section || !holder) return
    let cancelled = false
    let capTimer = 0

    const boot = () => {
      const canvas = document.createElement('canvas')
      canvasRef.current = canvas
      canvas.tabIndex = 0
      canvas.style.outline = 'none'
      holder.appendChild(canvas)
      import('@/game/createRideGame').then(({ createRideGame }) => {
        if (cancelled) return
        handleRef.current = createRideGame(canvas, {
          onMilestone: setMilestone,
          onPickupStart: () => setInPickup(true),
          onSophiePickup: () => {
            setSophieAboard(true)
            capTimer = window.setTimeout(() => setInPickup(false), 1400)
          },
          onCollect: () => setHearts((h) => h + 1),
          onFinish: () => {
            setFinished(true)
            unlock()
          },
        })
        setReady(true)
      })
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          boot()
        }
      },
      { rootMargin: '100%' },
    )
    io.observe(section)

    return () => {
      cancelled = true
      io.disconnect()
      window.clearTimeout(capTimer)
      handleRef.current?.destroy()
      handleRef.current = null
      canvasRef.current?.remove()
      canvasRef.current = null
      unlock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pause the engine whenever the section leaves the viewport.
  useEffect(() => {
    const section = sectionRef.current
    if (!section || !ready) return
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting)
      if (visible) handleRef.current?.resume()
      else handleRef.current?.pause()
    })
    io.observe(section)
    return () => io.disconnect()
  }, [ready])

  // Distance clock → HUD progress, polled gently; the game stays canvas-side.
  useEffect(() => {
    if (!started || finished) return
    const id = window.setInterval(() => {
      setDistance(handleRef.current?.getDistance() ?? 0)
    }, 200)
    return () => window.clearInterval(id)
  }, [started, finished])

  // First hop dismisses the hint chip.
  useEffect(() => {
    if (!started || hopped) return
    const dismiss = (e: Event) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return
      setHopped(true)
    }
    window.addEventListener('pointerdown', dismiss)
    window.addEventListener('keydown', dismiss)
    return () => {
      window.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('keydown', dismiss)
    }
  }, [started, hopped])

  const start = () => {
    const section = sectionRef.current
    if (!section || !handleRef.current) return
    setStarted(true)
    // Snap the section flush with the viewport before locking scroll.
    const top = window.scrollY + section.getBoundingClientRect().top
    if (lenis) lenis.scrollTo(top, { immediate: true })
    else window.scrollTo(0, top)
    lock()
    handleRef.current.start()
    canvasRef.current?.focus()
  }

  // Skip or finish: release the lock and glide just past the section so the
  // Album takes over. Lenis re-measures on the frame after the overflow lock
  // clears — scrolling before that clamps the target to 0.
  const leave = () => {
    unlock()
    requestAnimationFrame(() => {
      const section = sectionRef.current
      if (!section) return
      lenis?.resize()
      const top = window.scrollY + section.getBoundingClientRect().top
      const target = top + section.offsetHeight
      if (lenis) lenis.scrollTo(target)
      else window.scrollTo({ top: target, behavior: 'smooth' })
    })
  }

  const act = finished
    ? 'act iii · the end'
    : inPickup && !sophieAboard
      ? 'act ii · a small hello'
      : sophieAboard
        ? 'act iii · together'
        : 'act i · riding alone'

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ height: '100dvh', background: P.bg }}
    >
      <div ref={holderRef} className="absolute inset-0" />

      {/* Vignette + grain — same treatment as the art pass screens. */}
      <div
        className="pointer-events-none absolute inset-0 z-5"
        style={{
          background: 'radial-gradient(120% 90% at 50% 42%, transparent 55%, rgba(75,21,40,0.16))',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-5"
        style={{ backgroundImage: 'url(/grain.png)', backgroundRepeat: 'repeat', opacity: 0.05 }}
        aria-hidden
      />

      {started && (
        <RideHud
          act={act}
          hearts={hearts}
          progress={(distance / TIMELINE.finish) * 100}
          milestones={MS_POSITIONS}
          passed={MILESTONES.map((def) => distance >= def.distance)}
          dim={milestone !== null}
        />
      )}

      {/* "tap to hop ✧" — fades out after the first hop. */}
      <AnimatePresence>
        {started && !hopped && !finished && (
          <m.div
            className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
            style={{ bottom: 22 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            <HudChip>tap to hop ✧</HudChip>
          </m.div>
        )}
      </AnimatePresence>

      {/* Act 2 capline while the world slows for Sophie. */}
      <AnimatePresence>
        {inPickup && (
          <m.div
            className="pointer-events-none absolute inset-x-0 z-10 text-center"
            style={{ bottom: 58 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span
              className="font-serif italic"
              style={{
                fontWeight: 600,
                fontSize: 15,
                lineHeight: 1.4,
                color: P.cream,
                textShadow: '0 1px 0 rgba(75,21,40,0.3)',
              }}
            >
              she&rsquo;s been waiting here&hellip;
            </span>
            <span
              className="mt-1.5 block font-sans uppercase"
              style={{
                fontWeight: 700,
                fontSize: 8,
                letterSpacing: '0.3em',
                color: 'rgba(250,238,218,0.65)',
              }}
            >
              the world slows to a stop
            </span>
          </m.div>
        )}
      </AnimatePresence>

      {!started && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-6">
          <span
            className="font-sans uppercase"
            style={{ color: P.ink, fontSize: 11, letterSpacing: '0.3em', opacity: 0.65 }}
          >
            scene four · the ride
          </span>
          <button
            onClick={start}
            disabled={!ready}
            className="font-sans"
            style={{
              padding: '12px 26px',
              background: 'rgba(26,26,46,0.78)',
              color: P.cream,
              border: '1px dashed rgba(250,238,218,0.5)',
              borderRadius: 4,
              letterSpacing: '0.18em',
              fontSize: 13,
              opacity: ready ? 1 : 0.5,
            }}
          >
            {ready ? 'tap to start the ride' : 'loading…'}
          </button>
        </div>
      )}

      {started && !finished && !milestone && (
        <button
          onClick={leave}
          className="font-sans absolute bottom-5 right-5 z-10"
          style={{ color: P.ink, fontSize: 11, letterSpacing: '0.2em', opacity: 0.55 }}
        >
          skip the ride ↓
        </button>
      )}

      <AnimatePresence>
        {finished && (
          <m.div
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 text-center"
              style={{ top: '20%' }}
            >
              <span
                className="font-serif italic"
                style={{ fontWeight: 600, fontSize: 19, lineHeight: 1.4, color: P.wine }}
              >
                and there you were ♡
              </span>
              <span
                className="mt-1.5 block font-sans uppercase"
                style={{
                  fontWeight: 700,
                  fontSize: 8,
                  letterSpacing: '0.3em',
                  color: 'rgba(75,21,40,0.6)',
                }}
              >
                18.6 km · every heart counted
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-16 flex justify-center">
              <button
                onClick={leave}
                className="font-serif italic"
                style={{ color: P.wine, fontSize: 16, opacity: 0.8 }}
              >
                and the ride goes on ↓
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {milestone && (
          <MemoryCard
            key={milestone.id}
            milestone={milestone}
            onResume={() => {
              setMilestone(null)
              handleRef.current?.resumeFromMemory()
              canvasRef.current?.focus()
            }}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
