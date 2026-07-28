export function normalizeDeg(deg: number): number {
  const r = deg % 360
  return r < 0 ? r + 360 : r
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function separation(a: number, b: number): number {
  const d = Math.abs(normalizeDeg(a) - normalizeDeg(b))
  return d > 180 ? 360 - d : d
}
