'use client'


// Sophie — white + ginger bicolor cat, curled asleep.
const C = {
  white:    '#FCF3E8', // body / chest / paws
  whiteHi:  '#FFFFFF', // belly highlight
  ginger:   '#E89456', // head cap, back patch, tail
  gingerHi: '#F2A968', // tail / patch highlight
  gingerLo: '#CC7339', // ginger shadow
  outline:  '#8A6047', // soft warm-brown outline
  innerEar: '#F2B3B8', // pink inner ear
  nose:     '#E0859A', // pink nose
  eye:      '#4A3322', // closed-eye arc
  whisker:  'rgba(120,90,70,0.45)',
  shadow:   'rgba(120,90,70,0.16)',
  zColor:   '#CC7A42',
} as const

type SophieVariant = 'sleeping'

interface SophieProps {
  variant?: SophieVariant
  className?: string
}

function SleepingCat() {
  return (
    <div style={{ width: 132, height: 104, position: 'relative' }}>
      {/* floating z z z */}
      {([
        { left: 96, top: 20, size: 9,  delay: 0   },
        { left: 105, top: 8, size: 11, delay: 1.3 },
        { left: 116, top: -4, size: 14, delay: 2.6 },
      ] as { left: number; top: number; size: number; delay: number }[]).map((z, i) => (
        <span
          key={i}
          className="absolute select-none leading-none font-sans"
          style={{
            left: z.left, top: z.top, fontSize: z.size, color: C.zColor,
            willChange: 'transform, opacity',
            animation: `sophie-z 6.7s ease-out ${z.delay}s infinite`,
          }}
        >
          z
        </span>
      ))}

      <svg
        width={132} height={104}
        viewBox="0 0 132 104"
        fill="none"
        style={{
          display: 'block', position: 'absolute', bottom: 0, left: 0,
          overflow: 'visible', transformOrigin: '66px 96px',
          willChange: 'transform',
          animation: 'sophie-breathe 3.8s ease-in-out infinite',
        }}
      >
        {/* ground shadow */}
        <ellipse cx={64} cy={97} rx={52} ry={6} fill={C.shadow} />

        {/* tail — wraps from back-left around the front, tip resting by the face */}
        <path
          d="M 30 64 C 4 66 2 96 32 95 C 60 94 84 90 96 76"
          stroke={C.gingerLo} strokeWidth={17} strokeLinecap="round" fill="none"
        />
        <path
          d="M 30 64 C 6 66 5 93 32 92 C 58 91 82 87 95 74"
          stroke={C.ginger} strokeWidth={13} strokeLinecap="round" fill="none"
        />
        <path
          d="M 34 64 C 14 67 13 88 34 87"
          stroke={C.gingerHi} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7}
        />

        {/* curled body */}
        <ellipse
          cx={58} cy={64} rx={47} ry={28}
          fill={C.white} stroke={C.outline} strokeWidth={2.5}
        />
        {/* ginger back patch */}
        <path
          d="M 30 44 Q 56 33 84 44 Q 80 60 56 60 Q 36 58 30 44 Z"
          fill={C.ginger}
        />
        <path
          d="M 34 45 Q 54 37 74 44"
          stroke={C.gingerHi} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.6}
        />
        {/* belly highlight */}
        <ellipse cx={54} cy={78} rx={30} ry={9} fill={C.whiteHi} opacity={0.6} />

        {/* ears (outer) */}
        <path d="M 75 38 L 80 13 L 96 34 Z" fill={C.ginger} stroke={C.outline} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M 99 33 L 113 14 L 117 40 Z" fill={C.ginger} stroke={C.outline} strokeWidth={2.5} strokeLinejoin="round" />
        {/* inner ears */}
        <path d="M 81 34 L 84 21 L 92 33 Z" fill={C.innerEar} />
        <path d="M 103 32 L 111 22 L 113 36 Z" fill={C.innerEar} />

        {/* head — tucked low on the right */}
        <circle cx={97} cy={56} r={24} fill={C.white} stroke={C.outline} strokeWidth={2.5} />
        {/* ginger cap on head */}
        <path
          d="M 75 50 Q 97 30 119 51 Q 116 40 108 33 Q 86 26 82 40 Q 76 44 75 50 Z"
          fill={C.ginger}
        />
        <path
          d="M 97 31 Q 109 34 116 47"
          stroke={C.gingerHi} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.55}
        />

        {/* closed sleeping eyes */}
        <path d="M 86 57 Q 90 62 94 57" stroke={C.eye} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        <path d="M 103 57 Q 107 62 111 57" stroke={C.eye} strokeWidth={2.4} strokeLinecap="round" fill="none" />

        {/* nose + mouth */}
        <path d="M 97 65 L 101 65 L 99 68 Z" fill={C.nose} />
        <path d="M 99 68 Q 99 71 96 71 M 99 68 Q 99 71 102 71" stroke={C.outline} strokeWidth={1.6} strokeLinecap="round" fill="none" />

        {/* whiskers */}
        <path d="M 95 66 Q 80 64 70 67 M 95 69 Q 80 70 71 74" stroke={C.whisker} strokeWidth={1.4} strokeLinecap="round" fill="none" />
        <path d="M 103 66 Q 117 64 124 67 M 103 69 Q 117 70 123 74" stroke={C.whisker} strokeWidth={1.4} strokeLinecap="round" fill="none" />

        {/* tucked front paws */}
        <ellipse cx={70} cy={86} rx={11} ry={7} fill={C.white} stroke={C.outline} strokeWidth={2} />
        <ellipse cx={88} cy={88} rx={11} ry={7} fill={C.white} stroke={C.outline} strokeWidth={2} />
        <path d="M 70 81 L 70 86 M 88 83 L 88 88" stroke={C.outline} strokeWidth={1.3} strokeLinecap="round" opacity={0.5} />
      </svg>
    </div>
  )
}

export default function Sophie({ variant = 'sleeping', className = '' }: SophieProps) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      {variant === 'sleeping' && <SleepingCat />}
    </div>
  )
}
