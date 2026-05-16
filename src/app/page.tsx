'use client'

import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUnlock } from '@/hooks/useUnlock'
import LockedHero from '@/components/scenes/LockedHero'
import Hero from '@/components/scenes/Hero'

export default function Home() {
  const { state, timeRemaining } = useUnlock()
  const showOverlay = state !== 'unlocked'

  // Lock body scroll while the overlay is up; restore once dissolved
  useEffect(() => {
    document.body.style.overflow = showOverlay ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [showOverlay])

  return (
    <main className="relative">
      <Hero />

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
