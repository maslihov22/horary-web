import type { AspectType, PlanetPos } from '../types'
import { normalizeDeg, separation } from '../astro/angles'

const ASPECTS: { type: AspectType; angle: number; orb: number }[] = [
  { type: 'conjunction', angle: 0,   orb: 8 },
  { type: 'sextile',     angle: 60,  orb: 6 },
  { type: 'square',      angle: 90,  orb: 8 },
  { type: 'trine',       angle: 120, orb: 8 },
  { type: 'opposition',  angle: 180, orb: 8 },
]

export interface AspectHit {
  type: AspectType
  orb: number
  applying: boolean
  degreesToPerfect: number
}

export function findAspect(a: PlanetPos, b: PlanetPos): AspectHit | null {
  const sepNow = separation(a.lon, b.lon)
  // separation a small step ahead, using real speeds (deg/day)
  const dt = 0.05
  const sepFuture = separation(
    normalizeDeg(a.lon + a.speed * dt),
    normalizeDeg(b.lon + b.speed * dt),
  )
  let best: AspectHit | null = null
  for (const asp of ASPECTS) {
    const orb = Math.abs(sepNow - asp.angle)
    if (orb <= asp.orb) {
      const orbFuture = Math.abs(sepFuture - asp.angle)
      const applying = orbFuture < orb   // getting closer to exact
      const hit: AspectHit = {
        type: asp.type, orb, applying, degreesToPerfect: orb,
      }
      if (!best || hit.orb < best.orb) best = hit
    }
  }
  return best
}
