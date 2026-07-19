'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { useLenis } from 'lenis/react'
import MemoryCard from '@/components/ui/MemoryCard'
import type { GameHandle, MilestoneDef } from '@/game/types'

const P = {
  bg: '#97C459',
  ink: '#1A1A2E',
  cream: '#FAEEDA',
} as const

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
          onSophiePickup: () => {},
          onCollect: () => {},
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

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ height: '100dvh', background: P.bg }}
    >
      <div ref={holderRef} className="absolute inset-0" />

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
            className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <button
              onClick={leave}
              className="font-serif italic"
              style={{ color: P.ink, fontSize: 16, opacity: 0.8 }}
            >
              and the ride goes on ↓
            </button>
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
