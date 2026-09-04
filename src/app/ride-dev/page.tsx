'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import MemoryCard from '@/components/ui/MemoryCard'
import { fetchRideSettings } from '@/lib/rideData'
import type { GameHandle, MilestoneDef, RideSettings } from '@/game/types'

// Dev harness for the ride game — graybox tuning only, never linked from the
// site. Delete before final deploy (same rule as /tune).
export default function RideDevPage() {
  const holderRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<GameHandle | null>(null)
  const [phase, setPhase] = useState<'booting' | 'idle' | 'riding'>('booting')
  const [distance, setDistance] = useState(0)
  const [milestone, setMilestone] = useState<MilestoneDef | null>(null)
  const [settings, setSettings] = useState<RideSettings | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      setDistance(Math.round(handleRef.current?.getDistance() ?? 0))
    }, 300)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return
    let cancelled = false
    let handle: GameHandle | null = null
    const canvas = document.createElement('canvas')
    holder.appendChild(canvas)

    Promise.all([import('@/game/createRideGame'), fetchRideSettings()]).then(
      ([{ createRideGame }, rideSettings]) => {
        if (cancelled) return
        setSettings(rideSettings)
        handle = createRideGame(
          canvas,
          {
            onMilestone: (def) => {
              console.log('[ride-dev] milestone', def.id)
              setMilestone(def)
            },
            onPickupStart: () => console.log('[ride-dev] pickup start'),
            onSophiePickup: () => console.log('[ride-dev] sophie pickup'),
            onCollect: (kind) => console.log('[ride-dev] collect', kind),
            onHit: () => console.log('[ride-dev] hit'),
            onFinish: () => console.log('[ride-dev] finish'),
          },
          rideSettings,
        )
        handleRef.current = handle
        setPhase('idle')
      },
    )

    return () => {
      cancelled = true
      handle?.destroy()
      handleRef.current = null
      canvas.remove()
    }
  }, [])

  const start = () => {
    handleRef.current?.start()
    setPhase('riding')
  }

  return (
    <main style={{ height: '100dvh', position: 'relative', background: '#1A1A2E', overflow: 'hidden' }}>
      <div ref={holderRef} style={{ position: 'absolute', inset: 0 }} />

      {phase === 'idle' && (
        <button
          onClick={start}
          className="font-sans"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '18dvh',
            transform: 'translateX(-50%)',
            padding: '10px 22px',
            background: 'rgba(26,26,46,0.72)',
            color: '#FAEEDA',
            border: '1px dashed rgba(250,238,218,0.5)',
            borderRadius: 4,
            letterSpacing: '0.18em',
            fontSize: 13,
          }}
        >
          tap to start the ride
        </button>
      )}

      <div
        className="font-sans"
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.5)',
          color: '#FAEEDA',
          fontSize: 11,
          letterSpacing: '0.08em',
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      >
        ride-dev · {phase} · d {distance}
      </div>

      <AnimatePresence>
        {milestone && (
          <MemoryCard
            key={milestone.id}
            milestone={milestone}
            onResume={() => {
              setMilestone(null)
              handleRef.current?.resumeFromMemory()
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
        {(
          [
            ['act1', Math.round((settings?.timeline.pickup ?? 7200) * 0.3)],
            ['act3', (settings?.timeline.pickup ?? 7200) + 800],
            ['finish', (settings?.timeline.finish ?? 18600) - 300],
          ] as const
        ).map(([label, d]) => (
          <button
            key={label}
            onClick={() => handleRef.current?.setDistance(d as number)}
            className="font-sans"
            style={{
              padding: '4px 10px',
              background: 'rgba(0,0,0,0.5)',
              color: '#FAEEDA',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid rgba(250,238,218,0.3)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </main>
  )
}
