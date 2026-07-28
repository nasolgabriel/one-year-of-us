import { DEFAULT_TIMELINE, RIDE_SPEED } from '@/game/config'
import { DEFAULT_CROP } from '@/lib/crop'
import { supabase } from '@/lib/supabase'
import type { RideSettings } from '@/game/types'

// Ride tuning rows — see /game-tune. `position` is a 0–1 fraction of the ride
// so checkpoints keep their relative pacing when the duration changes.
export type RideConfig = {
  id: number
  duration_s: number
  pickup_frac: number
}

export type RideMilestoneRow = {
  id: number
  position: number
  title: string
  date_label: string
  caption: string
  image_url: string | null
  pos_x: number
  pos_y: number
  zoom: number
  orient: number
}

export type RideMilestoneUpdate = Partial<Omit<RideMilestoneRow, 'id'>>

const MS_COLS = 'id, position, title, date_label, caption, image_url, pos_x, pos_y, zoom, orient'

export async function fetchRideConfig(): Promise<RideConfig> {
  const { data, error } = await supabase
    .from('ride_config')
    .select('id, duration_s, pickup_frac')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data
}

export async function updateRideConfig(fields: Partial<Omit<RideConfig, 'id'>>): Promise<void> {
  const { error } = await supabase.from('ride_config').update(fields).eq('id', 1)
  if (error) throw error
}

export async function fetchRideMilestones(): Promise<RideMilestoneRow[]> {
  const { data, error } = await supabase.from('ride_milestone').select(MS_COLS).order('position')
  if (error) throw error
  return data
}

export async function insertRideMilestone(
  row: Omit<RideMilestoneRow, 'id'>,
): Promise<RideMilestoneRow> {
  const { data, error } = await supabase.from('ride_milestone').insert(row).select(MS_COLS).single()
  if (error) throw error
  return data
}

export async function updateRideMilestone(id: number, fields: RideMilestoneUpdate): Promise<void> {
  const { error } = await supabase.from('ride_milestone').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteRideMilestone(id: number): Promise<void> {
  const { error } = await supabase.from('ride_milestone').delete().eq('id', id)
  if (error) throw error
}

// DB rows → runtime settings. Milestone ids re-sequence by ride order so the
// card's "memory 01" numbering follows position, not DB id.
export function toRideSettings(config: RideConfig, rows: RideMilestoneRow[]): RideSettings {
  const finish = config.duration_s * RIDE_SPEED
  const milestones = [...rows]
    .sort((a, b) => a.position - b.position)
    .map((r, i) => ({
      id: i + 1,
      distance: Math.round(finish * r.position),
      title: r.title,
      date: r.date_label,
      caption: r.caption,
      photoUrl: r.image_url,
      crop: { posX: r.pos_x, posY: r.pos_y, zoom: r.zoom, orient: r.orient },
    }))
  return { timeline: { pickup: Math.round(finish * config.pickup_frac), finish }, milestones }
}

// Fallback when Supabase is unreachable — the ride still runs, with the
// original placeholder beats.
export const DEFAULT_RIDE_SETTINGS: RideSettings = {
  timeline: DEFAULT_TIMELINE,
  milestones: [2400, 4800, 10800, 14400, 18000].map((distance, i) => ({
    id: i + 1,
    distance,
    title: `milestone ${i + 1}`,
    date: `date · ${i + 1}`,
    caption: 'placeholder caption — a line or two about this memory.',
    photoUrl: null,
    crop: DEFAULT_CROP,
  })),
}

export async function fetchRideSettings(): Promise<RideSettings> {
  try {
    const [config, rows] = await Promise.all([fetchRideConfig(), fetchRideMilestones()])
    return toRideSettings(config, rows)
  } catch {
    return DEFAULT_RIDE_SETTINGS
  }
}
