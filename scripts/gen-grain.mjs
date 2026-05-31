// One-off: bake a seamless 128x128 grayscale noise tile to public/grain.png.
// Replaces the runtime feTurbulence SVG filter (expensive full-screen raster on
// mobile) with a cheap repeating background-image. Run: node scripts/gen-grain.mjs
import zlib from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const SIZE = 128

// Deterministic PRNG so the tile is reproducible.
let seed = 0x2a1810
const rand = () => {
  seed ^= seed << 13
  seed ^= seed >>> 17
  seed ^= seed << 5
  return ((seed >>> 0) % 1000) / 1000
}

// Raw image: one filter byte (0) per scanline + SIZE grayscale bytes.
const raw = Buffer.alloc((SIZE + 1) * SIZE)
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE + 1)] = 0
  for (let x = 0; x < SIZE; x++) {
    raw[y * (SIZE + 1) + 1 + x] = Math.floor(rand() * 256)
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 0 // color type: grayscale
// 10,11,12 = 0 (compression, filter, interlace)

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

mkdirSync('public', { recursive: true })
writeFileSync('public/grain.png', png)
console.log(`wrote public/grain.png (${png.length} bytes)`)
