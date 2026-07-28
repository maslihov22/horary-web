import type { Chart, PlanetName } from '../types'
import { normalizeDeg } from '../astro/angles'

// Besiegement — Lilly demonstrates it bodily: Mars at 10° Aries, Saturn at 15°
// Aries, and Venus besieged between them at 13°. A planet hemmed in between the
// bodies of both infortunes "is in great affliction", having no way out that
// does not meet a malefic.
//
// Later authors extend besiegement to aspects as well; Lilly's own example does
// not, and this engine follows him rather than the extension.
//
// The confinement must be close: a planet merely somewhere in the arc between
// two malefics halfway round the zodiac is not besieged. Lilly's own case spans
// 5°, and the traditional limit is the malefics being within one sign of each
// other.
const MAX_SPAN = 30

export function isBesieged(planet: PlanetName, chart: Chart): boolean {
  if (planet === 'Mars' || planet === 'Saturn') return false

  const mars = normalizeDeg(chart.planets.Mars.lon)
  const saturn = normalizeDeg(chart.planets.Saturn.lon)
  const target = normalizeDeg(chart.planets[planet].lon)

  // Measure the shorter arc between the malefics; the besieged planet must sit
  // inside it.
  const forward = normalizeDeg(saturn - mars)
  const [from, span] = forward <= 180
    ? [mars, forward]
    : [saturn, normalizeDeg(mars - saturn)]

  if (span > MAX_SPAN) return false

  const offset = normalizeDeg(target - from)
  return offset > 0 && offset < span
}
