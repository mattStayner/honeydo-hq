import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
    }
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size)
      const i = row + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function paintIcon(x, y, size) {
  const nx = (x + 0.5) / size
  const ny = (y + 0.5) / size
  // dark rounded background
  const cx = 0.5
  const cy = 0.5
  const dx = Math.abs(nx - cx)
  const dy = Math.abs(ny - cy)
  const inRound = Math.max(dx, dy) < 0.46 || dx * dx + dy * dy < 0.48 * 0.48
  if (!inRound) return [0, 0, 0, 0]

  // hexagon-ish fill
  const hx = (nx - 0.5) * 2
  const hy = (ny - 0.5) * 2
  const hex = Math.abs(hx) + Math.abs(hy) * 0.55 < 0.72
  if (hex) {
    // amber stripes
    if (Math.abs(hy) < 0.08 || (hy > 0.12 && hy < 0.28)) {
      return [232, 163, 23, 255]
    }
    return [18, 16, 14, 255]
  }
  return [26, 22, 18, 255]
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `bee-${size}.png`), png(size, paintIcon))
}

console.log('Icons written to public/icons')
