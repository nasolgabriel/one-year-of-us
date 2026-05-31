'use client'

import { useState, useEffect } from 'react'
import {
  checkIsUnlocked,
  getTimeRemaining,
  getStoredUnlock,
  setStoredUnlock,
  type TimeRemaining,
} from '@/lib/unlock'

export type { TimeRemaining }
export type UnlockState = 'sealed' | 'unlocking' | 'unlocked'


export const UNLOCK_ANIMATION_MS = 2400
const SEAL_REVEAL_MS = 700

export function useUnlock() {
  const [state, setState] = useState<UnlockState>('sealed')
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const params = window.location.search

    if (params.includes('reset')) {
      localStorage.removeItem('oneyearofus_unlocked')
      document.cookie = 'oneyearofus_unlocked=; path=/; max-age=0'
    }

    // ?bypass skips the overlay without persisting — regular visits still see the lock
    if (params.includes('bypass')) {
      setState('unlocked')
      return
    }

    // Repeat visit — already unlocked, skip the whole thing
    if (getStoredUnlock()) {
      setState('unlocked')
      return
    }

    // First visit, but the unlock date has already passed — show seal briefly,
    // then play the unlock animation
    if (checkIsUnlocked()) {
      const t1 = setTimeout(() => setState('unlocking'), SEAL_REVEAL_MS)
      const t2 = setTimeout(() => {
        setStoredUnlock()
        setState('unlocked')
      }, SEAL_REVEAL_MS + UNLOCK_ANIMATION_MS)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }

    // Pre-unlock — tick the countdown, fire animation when zero
    setTimeRemaining(getTimeRemaining())
    let unlockTimer: ReturnType<typeof setTimeout> | null = null

    const interval = setInterval(() => {
      if (checkIsUnlocked()) {
        clearInterval(interval)
        setState('unlocking')
        unlockTimer = setTimeout(() => {
          setStoredUnlock()
          setState('unlocked')
        }, UNLOCK_ANIMATION_MS)
      } else {
        setTimeRemaining(getTimeRemaining())
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      if (unlockTimer) clearTimeout(unlockTimer)
    }
  }, [])

  return { state, timeRemaining }
}
