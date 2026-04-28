'use client'

import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUnlock } from '@/hooks/useUnlock'
import LockedHero from '@/components/scenes/LockedHero'

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
      {/* Scene 2 placeholder — peeks through after the overlay dissolves */}
      <section
        className="flex h-dvh w-full items-center justify-center px-6"
        style={{ background: 'linear-gradient(180deg, #FAC775 0%, #FAEEDA 60%, #FBEAF0 100%)' }}
      >
        <div className="text-center">
          <p
            className="font-serif italic"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              color: '#712B13',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            one year of us
          </p>
          <p
            className="font-serif italic mt-3"
            style={{
              fontSize: 'clamp(1rem, 1.4vw, 1.25rem)',
              color: '#854F0B',
            }}
          >
            for you, my love ♡
          </p>
        </div>
      </section>

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
