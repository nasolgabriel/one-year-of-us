// Pins the page by fixing <body> at -y. Unlike an overflow lock, this freezes the
// page at an exact offset even if a touch fling is still carrying it, so callers
// can pass the offset they want flush with the viewport.
let lockedY: number | null = null

export function lockScroll(y: number) {
  if (lockedY !== null) return
  lockedY = y
  const { style } = document.body
  document.documentElement.style.overflow = 'hidden'
  style.position = 'fixed'
  style.top = `-${y}px`
  style.left = '0'
  style.right = '0'
}

export function unlockScroll() {
  if (lockedY === null) return
  const y = lockedY
  lockedY = null
  const { style } = document.body
  document.documentElement.style.overflow = ''
  style.position = ''
  style.top = ''
  style.left = ''
  style.right = ''
  window.scrollTo(0, y)
}
