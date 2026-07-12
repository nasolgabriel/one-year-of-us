'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { fetchPhotos, fetchFeaturedPhoto, type Photo } from '@/lib/supabase'

// Mounted behind the locked overlay: renders every scene photo invisibly at the
// same size the real scenes use, so the browser downloads identical optimizer
// URLs early and the album opens from cache instead of the network.
export default function PhotoPreloader() {
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchPhotos(), fetchFeaturedPhoto()])
      .then(([album, featured]) => {
        if (cancelled) return
        setPhotos(featured ? [featured, ...album] : album)
      })
      .catch(() => {}) // preload is best-effort; scenes fetch on their own anyway
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      {photos.map((p) => (
        <div key={p.id} style={{ position: 'relative', width: 248, height: 296 }}>
          <Image src={p.image_url} alt="" fill sizes="248px" loading="eager" />
        </div>
      ))}
    </div>
  )
}
