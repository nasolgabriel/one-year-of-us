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
        // naiveDimensions: <html> is h-full, so the ResizeObserver Lenis puts on it
        // never fires as scenes mount — without it the scroll limit stays 0 until
        // a window resize and every wheel/scrollTo clamps to the top.
        <ReactLenis
          root
          options={{ lerp: 0.1, duration: 1.1, smoothWheel: true, naiveDimensions: true }}
        >
          {children}
        </ReactLenis>
      )}
    </LazyMotion>
  )
}
