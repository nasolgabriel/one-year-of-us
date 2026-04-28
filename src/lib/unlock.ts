import { UNLOCK_DATE } from './constants'

export function checkIsUnlocked(): boolean {
  return Date.now() >= UNLOCK_DATE.getTime()
}

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function getTimeRemaining(): TimeRemaining {
  const diff = UNLOCK_DATE.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

const STORAGE_KEY = 'oneyearofus_unlocked'

export function getStoredUnlock(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setStoredUnlock(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, 'true')
  // Cookie lets middleware enforce route guards on the server side
  document.cookie = `${STORAGE_KEY}=true; path=/; max-age=31536000; SameSite=Strict`
}
