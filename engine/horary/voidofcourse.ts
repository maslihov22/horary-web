import type { Chart, PlanetName } from '../types'
import { findAspect } from './aspects'
import { normalizeDeg } from '../astro/angles'

// The Moon is void of course when it makes no applying Ptolemaic aspect to any
// other planet before it leaves its current sign.
export function isMoonVoid(chart: Chart): boolean {
  const moon = chart.planets.Moon
  const degToSignExit = 30 - (normalizeDeg(moon.lon) % 30)
  const others: PlanetName[] = ['Sun','Mercury','Venus','Mars','Jupiter','Saturn']
  for (const name of others) {
    const hit = findAspect(moon, chart.planets[name])
    if (hit && hit.applying && hit.degreesToPerfect <= degToSignExit) {
      return false // an aspect perfects before the Moon leaves its sign
    }
  }
  return true
}
