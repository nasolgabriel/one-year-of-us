'use client'

import { useSyncExternalStore } from 'react'
import { isMusicOn, subscribeMusic, toggleMusic } from '@/lib/music'

export default function MusicToggle() {
  const on = useSyncExternalStore(subscribeMusic, isMusicOn, () => false)
  const muted = !on

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-pressed={on}
      aria-label={on ? 'music on' : 'music off'}
      className="font-sans fixed z-50"
      style={{
        right: 14,
        bottom: 14,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 9,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: '#FAEEDA',
        background: 'rgba(26,26,46,0.42)',
        border: '1px dashed rgba(250,238,218,0.5)',
        borderRadius: 2,
        padding: '6px 8px 5px',
        whiteSpace: 'nowrap',
        opacity: muted ? 0.55 : 1,
        transition: 'opacity 0.25s',
        cursor: 'pointer',
        backdropFilter: 'blur(2px)',
      }}
    >
      <span aria-hidden style={{ fontSize: 10, lineHeight: 1 }}>
        {muted ? '·' : '♪'}
      </span>
      {muted ? 'muted' : 'music'}
    </button>
  )
}
