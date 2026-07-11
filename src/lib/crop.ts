import type { CSSProperties } from 'react'

export type Crop = { posX: number; posY: number; zoom: number; orient: number }

export const DEFAULT_CROP: Crop = { posX: 50, posY: 50, zoom: 1, orient: 0 }

// objectPosition only pans the object-fit cover overflow — scale() overflow is
// invisible to it, so the pan sliders also drive a screen-space translate whose
// range grows with zoom: max offset each side is (zoom - 1) * 50% of the frame.
export function cropImageStyle(c: Crop): CSSProperties {
  const tx = (50 - c.posX) * (c.zoom - 1)
  const ty = (50 - c.posY) * (c.zoom - 1)
  return {
    objectFit: 'cover',
    objectPosition: `${c.posX}% ${c.posY}%`,
    transform: `translate(${tx}%, ${ty}%) rotate(${c.orient}deg) scale(${c.zoom})`,
  }
}
