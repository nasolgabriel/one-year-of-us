'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  fetchAllPhotos,
  updatePhoto,
  clearFeatured,
  type Photo,
  type PhotoUpdate,
} from '@/lib/supabase'
import { cropImageStyle } from '@/lib/crop'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

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
      <span className="w-10 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <span className="w-10 shrink-0 text-right tabular-nums">{value}</span>
    </label>
  )
}

function TuneCard({
  photo,
  usedOrders,
  maxOrder,
  onSaved,
  onFeatured,
}: {
  photo: Photo
  usedOrders: Set<number>
  maxOrder: number
  onSaved: (id: number, fields: PhotoUpdate) => void
  onFeatured: (id: number) => void
}) {
  const [order, setOrder] = useState(photo.order_index)
  const [title, setTitle] = useState(photo.title)
  const [caption, setCaption] = useState(photo.caption ?? '')
  const [posX, setPosX] = useState(photo.pos_x)
  const [posY, setPosY] = useState(photo.pos_y)
  const [zoom, setZoom] = useState(photo.zoom)
  const [orient, setOrient] = useState(photo.orient)
  const [save, setSave] = useState<SaveState>('idle')

  const dirty =
    order !== photo.order_index ||
    title !== photo.title ||
    caption !== (photo.caption ?? '') ||
    posX !== photo.pos_x ||
    posY !== photo.pos_y ||
    zoom !== photo.zoom ||
    orient !== photo.orient

  const inAlbum = photo.order_index > 0

  // Slot free if no other photo saved it; own saved slot always selectable.
  const slotOptions = Array.from({ length: maxOrder }, (_, i) => i + 1).filter(
    (n) => !usedOrders.has(n) || n === photo.order_index,
  )

  async function onSave() {
    setSave('saving')
    const fields: PhotoUpdate = {
      order_index: order,
      title,
      caption: caption || null,
      pos_x: posX,
      pos_y: posY,
      zoom,
      orient,
    }
    try {
      await updatePhoto(photo.id, fields)
      onSaved(photo.id, fields)
      setSave('saved')
      setTimeout(() => setSave('idle'), 1500)
    } catch {
      setSave('error')
    }
  }

  async function onMakeFeatured() {
    setSave('saving')
    try {
      await clearFeatured()
      await updatePhoto(photo.id, { featured: true })
      setOrder(0)
      onFeatured(photo.id)
      setSave('saved')
      setTimeout(() => setSave('idle'), 1500)
    } catch {
      setSave('error')
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow"
      style={{ opacity: photo.order_index === 0 && !photo.featured ? 0.6 : 1 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{photo.image_url.split('/').pop()}</span>
        <span className="flex gap-2">
          {photo.featured && (
            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
              first photo ♡
            </span>
          )}
          {inAlbum ? (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
              album #{photo.order_index}
            </span>
          ) : (
            !photo.featured && (
              <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-500">
                unused
              </span>
            )
          )}
        </span>
      </div>

      <div
        className="relative mx-auto overflow-hidden bg-neutral-200"
        style={{ width: 248, height: 296 }}
      >
        <Image
          src={photo.image_url}
          alt={title || 'photo'}
          fill
          sizes="600px"
          style={cropImageStyle({ posX, posY, zoom, orient })}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="w-12 shrink-0">order</span>
        <select
          value={order}
          disabled={photo.featured}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="w-28 rounded border border-neutral-300 px-2 py-1 disabled:bg-neutral-100"
        >
          <option value={0}>— none —</option>
          {slotOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {photo.featured ? (
          <span className="text-neutral-400">first photo — can&apos;t be in album</span>
        ) : (
          <span className="text-neutral-400">taken numbers hidden</span>
        )}
      </label>

      <label className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="w-12 shrink-0">title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-neutral-300 px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-neutral-600">
        <span className="w-12 shrink-0">caption</span>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="us ♡"
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
        {!photo.featured &&
          (inAlbum ? (
            <span className="text-xs text-neutral-400" title="Set order to — none — and save first">
              in album — can&apos;t be first photo
            </span>
          ) : (
            <button
              onClick={onMakeFeatured}
              disabled={save === 'saving'}
              className="rounded border border-purple-300 px-3 py-1.5 text-xs text-purple-700"
            >
              make first photo
            </button>
          ))}
        {save === 'saved' && <span className="text-xs text-green-600">saved ✓</span>}
        {save === 'error' && (
          <span className="text-xs text-red-600">failed — slot taken or RLS policy missing</span>
        )}
        {dirty && save === 'idle' && <span className="text-xs text-amber-600">unsaved</span>}
      </div>
    </div>
  )
}

export default function TunePage() {
  const [photos, setPhotos] = useState<Photo[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllPhotos().then(setPhotos).catch((e) => setError(String(e)))
  }, [])

  function handleSaved(id: number, fields: PhotoUpdate) {
    setPhotos((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, ...fields } : p)) : prev))
  }

  // Featured is exclusive; the new first photo also leaves the album (order 0).
  function handleFeatured(id: number) {
    setPhotos((prev) =>
      prev
        ? prev.map((p) =>
            p.id === id
              ? { ...p, featured: true, order_index: 0 }
              : { ...p, featured: false },
          )
        : prev,
    )
  }

  const usedOrders = new Set(
    (photos ?? []).filter((p) => p.order_index > 0).map((p) => p.order_index),
  )

  const sorted = photos
    ? [...photos].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        if ((a.order_index === 0) !== (b.order_index === 0)) return a.order_index === 0 ? 1 : -1
        return a.order_index - b.order_index
      })
    : null

  return (
    <main className="min-h-dvh bg-neutral-100 p-6">
      <h1 className="mb-1 text-xl font-semibold text-neutral-800">photo tuner</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Each photo lives in one place: the first-photo frame, the album (unique order number), or
        unused. Taken order numbers disappear from the other dropdowns.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!photos && !error && <p className="text-sm text-neutral-500">loading…</p>}

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {sorted?.map((p) => (
          <TuneCard
            key={p.id}
            photo={p}
            usedOrders={usedOrders}
            maxOrder={photos?.length ?? 0}
            onSaved={handleSaved}
            onFeatured={handleFeatured}
          />
        ))}
      </div>
    </main>
  )
}
