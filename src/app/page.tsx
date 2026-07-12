'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { useLenis } from 'lenis/react'
import { useUnlock } from '@/hooks/useUnlock'
import LockedHero from '@/components/scenes/LockedHero'
import Hero from '@/components/scenes/Hero'
import PhotoPreloader from '@/components/PhotoPreloader'

const BeforeBeginning = dynamic(() => import('@/components/scenes/BeforeBeginning'), { ssr: false })
const Album = dynamic(() => import('@/components/scenes/Album'), { ssr: false })

export default function Home() {
  const { state, timeRemaining } = useUnlock()
  const lenis = useLenis()
  const showOverlay = state !== 'unlocked'
  // Mount scenes only at 'unlocked' (when the overlay starts its fade-out) so the
  // hero's one-shot entrance reveal plays AS the overlay clears — not hidden behind
  // it during 'unlocking'. The overlay's fade still covers the mount frame, no flash.
  const showScenes = state === 'unlocked'

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
      {showScenes && (
        <>
          <Hero />
          <BeforeBeginning />
          <Album />
        </>
      )}

      {showOverlay && <PhotoPreloader />}

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
