'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { fetchAllPhotos, updatePhotoCrop, type Photo } from '@/lib/supabase'
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

function TuneCard({ photo }: { photo: Photo }) {
  const [posX, setPosX] = useState(photo.pos_x)
  const [posY, setPosY] = useState(photo.pos_y)
  const [zoom, setZoom] = useState(photo.zoom)
  const [orient, setOrient] = useState(photo.orient)
  const [save, setSave] = useState<SaveState>('idle')

  const dirty =
    posX !== photo.pos_x || posY !== photo.pos_y || zoom !== photo.zoom || orient !== photo.orient

  async function onSave() {
    setSave('saving')
    try {
      await updatePhotoCrop(photo.id, { pos_x: posX, pos_y: posY, zoom, orient })
      photo.pos_x = posX
      photo.pos_y = posY
      photo.zoom = zoom
      photo.orient = orient
      setSave('saved')
      setTimeout(() => setSave('idle'), 1500)
    } catch {
      setSave('error')
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow">
      <p className="text-sm font-medium text-neutral-800">
        #{photo.order_index} · {photo.title}
        <span className="ml-2 text-xs text-neutral-400">
          {photo.image_url.split('/').pop()}
        </span>
      </p>

      <div
        className="relative mx-auto overflow-hidden bg-neutral-200"
        style={{ width: 248, height: 296 }}
      >
        <Image
          src={photo.image_url}
          alt={photo.title}
          fill
          sizes="248px"
          style={cropImageStyle({ posX, posY, zoom, orient })}
        />
      </div>

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
        {save === 'error' && <span className="text-xs text-red-600">failed — RLS update policy missing?</span>}
        {dirty && save === 'idle' && <span className="text-xs text-amber-600">unsaved changes</span>}
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

  return (
    <main className="min-h-dvh bg-neutral-100 p-6">
      <h1 className="mb-1 text-xl font-semibold text-neutral-800">photo crop tuner</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Adjust each photo to sit right in its polaroid frame. Values save to Supabase; the site
        reads them on load. Internal tool — not linked from the site.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!photos && !error && <p className="text-sm text-neutral-500">loading…</p>}

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {photos?.map((p) => <TuneCard key={p.id} photo={p} />)}
      </div>
    </main>
  )
}
