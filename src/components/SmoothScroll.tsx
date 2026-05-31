'use client'

import { ReactLenis } from 'lenis/react'
import { LazyMotion, domAnimation, useReducedMotion } from 'framer-motion'

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion()

  return (
    <LazyMotion features={domAnimation} strict>
      {prefersReduced ? (
        children
      ) : (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.1, smoothWheel: true }}>
          {children}
        </ReactLenis>
      )}
    </LazyMotion>
  )
}
