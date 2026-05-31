'use client'

import { ReactLenis } from 'lenis/react'
import { useReducedMotion } from 'framer-motion'

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) return <>{children}</>

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}
