'use client'

import { useEffect, useState } from 'react'
import MemoryCard from '@/components/ui/MemoryCard'
import { RIDE_SPEED } from '@/game/config'
import type { MilestoneDef } from '@/game/types'
import {
  deleteRideMilestone,
  fetchRideConfig,
  fetchRideMilestones,
  insertRideMilestone,
  updateRideConfig,
  updateRideMilestone,
  type RideConfig,
  type RideMilestoneRow,
  type RideMilestoneUpdate,
} from '@/lib/rideData'
import { fetchAllPhotos } from '@/lib/supabase'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type PhotoOption = { name: string; url: string }

// Keep-out zones on the 0–1 ride axis: a polaroid inside the Sophie pickup
// beat or the finish brake would collide with those sequences, and two
// polaroids closer than MIN_GAP would stack memory cards.
const PICKUP_BUFFER = 0.06
const FINISH_BUFFER = 0.03
const MIN_GAP = 0.03

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-neutral-600">
      <span className="w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <span className="w-12 shrink-0 text-right tabular-nums">{value}</span>
    </label>
  )
}

function TimelineStrip({ pickupFrac, positions }: { pickupFrac: number; positions: number[] }) {
  return (
    <div className="relative h-8 rounded bg-neutral-200">
      <div
        className="absolute inset-y-0 rounded-sm bg-red-200/70"
        style={{
          left: `${(pickupFrac - PICKUP_BUFFER) * 100}%`,
          width: `${PICKUP_BUFFER * 2 * 100}%`,
        }}
        title="sophie pickup — keep polaroids out"
      />
      <div
        className="absolute inset-y-0 rounded-sm bg-red-200/70"
        style={{ left: `${(1 - FINISH_BUFFER) * 100}%`, right: 0 }}
        title="finish brake — keep polaroids out"
      />
      <span
        className="absolute -translate-x-1/2 text-[10px] text-neutral-500"
        style={{ left: `${pickupFrac * 100}%`, top: '100%' }}
      >
        sophie
      </span>
      {positions.map((p, i) => (
        <span
          key={i}
          className="absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-white"
          style={{ left: `${p * 100}%` }}
        >
          {i + 1}
        </span>
      ))}
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500">
        ✧
      </span>
    </div>
  )
}

function ConfigCard({ config, onSaved }: { config: RideConfig; onSaved: (c: RideConfig) => void }) {
  const [duration, setDuration] = useState(config.duration_s)
  const [pickupPct, setPickupPct] = useState(Math.round(config.pickup_frac * 200) / 2)
  const [save, setSave] = useState<SaveState>('idle')

  const dirty =
    duration !== config.duration_s || pickupPct !== Math.round(config.pickup_frac * 200) / 2

  async function onSave() {
    setSave('saving')
    const fields = { duration_s: duration, pickup_frac: pickupPct / 100 }
    try {
      await updateRideConfig(fields)
      onSaved({ ...config, ...fields })
      setSave('saved')
      setTimeout(() => setSave('idle'), 1500)
    } catch {
      setSave('error')
    }
  }

  const finish = duration * RIDE_SPEED

  return (
    <div className="flex max-w-xl flex-col gap-3 rounded-lg bg-white p-4 shadow">
      <h2 className="text-sm font-semibold text-neutral-800">ride settings</h2>
      <Slider label="length s" value={duration} min={60} max={300} step={5} onChange={setDuration} />
      <Slider
        label="sophie %"
        value={pickupPct}
        min={15}
        max={70}
        step={0.5}
        onChange={setPickupPct}
      />
      <p className="text-xs text-neutral-400">
        ride shows as {(finish / 1000).toFixed(1)} km · sophie hops in around{' '}
        {Math.round((duration * pickupPct) / 100)}s
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={!dirty || save === 'saving'}
          className="rounded bg-neutral-800 px-4 py-1.5 text-sm text-white disabled:opacity-30"
        >
          {save === 'saving' ? 'saving…' : 'save'}
        </button>
        {save === 'saved' && <span className="text-xs text-green-600">saved ✓</span>}
        {save === 'error' && <span className="text-xs text-red-600">failed — RLS policy missing?</span>}
        {dirty && save === 'idle' && <span className="text-xs text-amber-600">unsaved</span>}
      </div>
    </div>
  )
}

function MilestoneCard({
  row,
  index,
  photos,
  pickupFrac,
  otherPositions,
  onSaved,
  onDeleted,
}: {
  row: RideMilestoneRow
  index: number
  photos: PhotoOption[]
  pickupFrac: number
  otherPositions: number[]
  onSaved: (id: number, fields: RideMilestoneUpdate) => void
  onDeleted: (id: number) => void
}) {
  const [posPct, setPosPct] = useState(Math.round(row.position * 1000) / 10)
  const [title, setTitle] = useState(row.title)
  const [dateLabel, setDateLabel] = useState(row.date_label)
  const [caption, setCaption] = useState(row.caption)
  const [imageUrl, setImageUrl] = useState(row.image_url ?? '')
  const [posX, setPosX] = useState(row.pos_x)
  const [posY, setPosY] = useState(row.pos_y)
  const [zoom, setZoom] = useState(row.zoom)
  const [orient, setOrient] = useState(row.orient)
  const [save, setSave] = useState<SaveState>('idle')

  const dirty =
    posPct !== Math.round(row.position * 1000) / 10 ||
    title !== row.title ||
    dateLabel !== row.date_label ||
    caption !== row.caption ||
    imageUrl !== (row.image_url ?? '') ||
    posX !== row.pos_x ||
    posY !== row.pos_y ||
    zoom !== row.zoom ||
    orient !== row.orient

  const frac = posPct / 100
  const inPickupZone = Math.abs(frac - pickupFrac) < PICKUP_BUFFER
  const inFinishZone = frac > 1 - FINISH_BUFFER
  const tooClose = otherPositions.some((o) => Math.abs(o - frac) < MIN_GAP)

  const previewDef: MilestoneDef = {
    id: index,
    distance: 0,
    title: title || `milestone ${index}`,
    date: dateLabel || 'date · —',
    caption: caption || 'caption goes here…',
    photoUrl: imageUrl || null,
    crop: { posX, posY, zoom, orient },
  }

  async function onSave() {
    setSave('saving')
    const fields: RideMilestoneUpdate = {
      position: frac,
      title,
      date_label: dateLabel,
      caption,
      image_url: imageUrl || null,
      pos_x: posX,
      pos_y: posY,
      zoom,
      orient,
    }
    try {
      await updateRideMilestone(row.id, fields)
      onSaved(row.id, fields)
      setSave('saved')
      setTimeout(() => setSave('idle'), 1500)
    } catch {
      setSave('error')
    }
  }

  async function onDelete() {
    if (!window.confirm(`delete milestone ${index}?`)) return
    setSave('saving')
    try {
      await deleteRideMilestone(row.id)
      onDeleted(row.id)
    } catch {
      setSave('error')
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <span className="rounded bg-pink-100 px-2 py-0.5 text-xs text-pink-700">
          memory {String(index).padStart(2, '0')}
        </span>
        <button onClick={onDelete} className="text-xs text-red-500 hover:underline">
          delete
        </button>
      </div>

      {/* Real MemoryCard, live — what the tuner shows is what the game shows. */}
      <div
        className="relative overflow-hidden rounded"
        style={{ height: 560, background: '#97C459' }}
      >
        <MemoryCard milestone={previewDef} onResume={() => {}} />
      </div>

      <Slider label="checkpoint" value={posPct} min={2} max={99} step={0.5} onChange={setPosPct} />
      {inPickupZone && (
        <p className="text-xs text-red-600">inside the sophie pickup beat — move it away</p>
      )}
      {inFinishZone && <p className="text-xs text-red-600">inside the finish brake — move it back</p>}
      {tooClose && !inPickupZone && !inFinishZone && (
        <p className="text-xs text-amber-600">very close to another milestone</p>
      )}

      <label className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="w-14 shrink-0">photo</span>
        <select
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded border border-neutral-300 px-2 py-1"
        >
          <option value="">— no photo —</option>
          {photos.map((p) => (
            <option key={p.url} value={p.url}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="w-14 shrink-0">title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-neutral-300 px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="w-14 shrink-0">date</span>
        <input
          type="text"
          value={dateLabel}
          onChange={(e) => setDateLabel(e.target.value)}
          placeholder="aug · the first hello"
          className="w-full rounded border border-neutral-300 px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="w-14 shrink-0">caption</span>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full rounded border border-neutral-300 px-2 py-1"
        />
      </label>

      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-600">rotate</span>
        {[0, 90, 180, 270].map((deg) => (
          <button
            key={deg}
            onClick={() => setOrient(deg)}
            className={`rounded px-2 py-1 text-xs ${
              orient === deg ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {deg}°
          </button>
        ))}
      </div>

      <Slider label="pan X" value={posX} min={0} max={100} step={1} onChange={setPosX} />
      <Slider label="pan Y" value={posY} min={0} max={100} step={1} onChange={setPosY} />
      <Slider label="zoom" value={zoom} min={1} max={3} step={0.05} onChange={setZoom} />

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={!dirty || save === 'saving'}
          className="rounded bg-neutral-800 px-4 py-1.5 text-sm text-white disabled:opacity-30"
        >
          {save === 'saving' ? 'saving…' : 'save'}
        </button>
        {save === 'saved' && <span className="text-xs text-green-600">saved ✓</span>}
        {save === 'error' && <span className="text-xs text-red-600">failed — RLS policy missing?</span>}
        {dirty && save === 'idle' && <span className="text-xs text-amber-600">unsaved</span>}
      </div>
    </div>
  )
}

export default function GameTunePage() {
  const [config, setConfig] = useState<RideConfig | null>(null)
  const [rows, setRows] = useState<RideMilestoneRow[] | null>(null)
  const [photos, setPhotos] = useState<PhotoOption[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchRideConfig(), fetchRideMilestones(), fetchAllPhotos()])
      .then(([c, ms, ps]) => {
        setConfig(c)
        setRows(ms)
        setPhotos(
          ps.map((p) => ({ url: p.image_url, name: p.image_url.split('/').pop() ?? p.image_url })),
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : JSON.stringify(e)))
  }, [])

  function handleSaved(id: number, fields: RideMilestoneUpdate) {
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...fields } : r)) : prev))
  }

  function handleDeleted(id: number) {
    setRows((prev) => (prev ? prev.filter((r) => r.id !== id) : prev))
  }

  // New milestone lands in the middle of the biggest free gap.
  async function addMilestone() {
    const sorted = (rows ?? []).map((r) => r.position).sort((a, b) => a - b)
    const edges = [0.04, ...sorted, 0.96]
    let best = 0.5
    let size = 0
    for (let i = 1; i < edges.length; i++) {
      const gap = edges[i] - edges[i - 1]
      if (gap > size) {
        size = gap
        best = (edges[i] + edges[i - 1]) / 2
      }
    }
    try {
      const row = await insertRideMilestone({
        position: Math.round(best * 1000) / 1000,
        title: '',
        date_label: '',
        caption: '',
        image_url: null,
        pos_x: 50,
        pos_y: 50,
        zoom: 1,
        orient: 0,
      })
      setRows((prev) => [...(prev ?? []), row])
    } catch (e) {
      setError(e instanceof Error ? e.message : JSON.stringify(e))
    }
  }

  const sorted = rows ? [...rows].sort((a, b) => a.position - b.position) : null

  return (
    <main className="min-h-dvh bg-neutral-100 p-6">
      <h1 className="mb-1 text-xl font-semibold text-neutral-800">ride tuner</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Each milestone is a polaroid on the road — catching it opens its memory card. Positions are
        % of the ride, so they survive length changes. Keep them out of the shaded zones.
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!config && !error && <p className="text-sm text-neutral-500">loading…</p>}

      {config && sorted && (
        <div className="flex flex-col gap-6">
          <ConfigCard config={config} onSaved={setConfig} />

          <div className="max-w-xl rounded-lg bg-white p-4 pb-7 shadow">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">
              the ride · {sorted.length} memories
            </h2>
            <TimelineStrip
              pickupFrac={config.pickup_frac}
              positions={sorted.map((r) => r.position)}
            />
          </div>

          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
          >
            {sorted.map((r, i) => (
              <MilestoneCard
                key={r.id}
                row={r}
                index={i + 1}
                photos={photos}
                pickupFrac={config.pickup_frac}
                otherPositions={sorted.filter((o) => o.id !== r.id).map((o) => o.position)}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
              />
            ))}
          </div>

          <button
            onClick={addMilestone}
            className="self-start rounded bg-neutral-800 px-4 py-2 text-sm text-white"
          >
            + add milestone
          </button>
        </div>
      )}
    </main>
  )
}
