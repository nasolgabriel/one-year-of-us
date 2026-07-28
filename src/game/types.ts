import type { KAPLAYCtx } from 'kaplay'
import type { Crop } from '@/lib/crop'

export type GamePhase = 'idle' | 'riding' | 'memory' | 'pickup' | 'finished'

export type CollectibleKind = 'heart' | 'polaroid' | 'yarn' | 'butterfly'

export type ObstacleKind = 'flowerPot' | 'puddle' | 'fence' | 'dog' | 'hose'

// The two story distances on the ride's virtual-px axis. Runtime-tuned via
// /game-tune (ride_config row) — nothing in the game hardcodes them.
export type RideTimeline = {
  pickup: number
  finish: number
}

export type MilestoneDef = {
  id: number
  distance: number
  title: string
  date: string
  caption: string
  photoUrl: string | null
  crop: Crop
}

// Everything runtime-tuned, fetched from Supabase before boot.
export type RideSettings = {
  timeline: RideTimeline
  milestones: MilestoneDef[]
}

// Events flow game → React. The only way the game talks to the DOM.
export type GameEvents = {
  onMilestone(def: MilestoneDef): void
  onPickupStart(): void
  onSophiePickup(): void
  onCollect(kind: CollectibleKind): void
  onFinish(): void
}

// Commands flow React → game. The only way the DOM talks to the game.
export type GameHandle = {
  start(): void
  resumeFromMemory(): void
  pause(): void
  resume(): void
  destroy(): void
  // Dev-harness helpers — the site scene never calls these.
  setDistance(d: number): void
  getDistance(): number
}

// Shared context passed to every game module. `phase` is written only by
// createRideGame; modules read it. `speedScale` is the world pace multiplier
// (0 = stopped, 1 = full ride) — memory mode and the Sophie pickup tween it.
export type RideCtx = {
  k: KAPLAYCtx
  events: GameEvents
  phase: GamePhase
  distance: number
  speedScale: number
  timeline: RideTimeline
}
