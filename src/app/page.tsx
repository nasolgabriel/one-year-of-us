'use client'

import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLenis } from 'lenis/react'
import { useUnlock } from '@/hooks/useUnlock'
import LockedHero from '@/components/scenes/LockedHero'
import Hero from '@/components/scenes/Hero'
import BeforeBeginning from '@/components/scenes/BeforeBeginning'
import Album from '@/components/scenes/Album'

export default function Home() {
  const { state, timeRemaining } = useUnlock()
  const lenis = useLenis()
  const showOverlay = state !== 'unlocked'

  useEffect(() => {
    document.body.style.overflow = showOverlay ? 'hidden' : ''
    if (showOverlay) lenis?.stop()
    else lenis?.start()
    return () => {
      document.body.style.overflow = ''
      lenis?.start()
    }
  }, [showOverlay, lenis])

  return (
    <main className="relative">
      <Hero />
      <BeforeBeginning />
      <Album />

      <AnimatePresence>
        {showOverlay && (
          <LockedHero
            key="locked-overlay"
            state={state}
            timeRemaining={timeRemaining}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
