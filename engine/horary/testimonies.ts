import type { Chart, PlanetName, PlanetPos } from '../types'
import { normalizeDeg, separation } from '../astro/angles'
import { findAspect } from './aspects'
import { signOf } from './rulerships'

// ─── Canonical horary testimonies (Lilly), evaluated qualitatively ───────────
//
// This module answers narrow yes/no questions about the chart the way a
// traditional astrologer reads them. No scores: each function returns a fact,
// and the engine composes those facts into a judgment.

const ALL: PlanetName[] = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']

/**
 * Prohibition: a third planet perfects an aspect with one significator BEFORE
 * the two significators complete their own aspect. The intervening planet
 * "prohibits" the matter — Lilly: the business is hindered by another party.
 * Returns the prohibiting planet, or null.
 */
export function findProhibition(
  qP: PlanetPos, tP: PlanetPos, chart: Chart,
): PlanetName | null {
  const between = findAspect(qP, tP)
  if (!between || !between.applying) return null
  const ownPerfection = between.degreesToPerfect
  for (const name of ALL) {
    if (name === qP.name || name === tP.name) continue
    const third = chart.planets[name]
    // does the third planet apply to either significator, perfecting sooner?
    for (const sig of [qP, tP]) {
      const a = findAspect(third, sig)
      if (a && a.applying && a.degreesToPerfect < ownPerfection) {
        return name
      }
    }
  }
  return null
}

/**
 * Refranation: a significator turns retrograde (or changes sign) before the
 * aspect between the significators perfects, "refraining" from completing it.
 * We detect the retrograde case: an applying significator with negative speed
 * pulling away. Returns true if the aspect is frustrated this way.
 */
export function isRefranated(qP: PlanetPos, tP: PlanetPos): boolean {
  const a = findAspect(qP, tP)
  if (!a || !a.applying) return false
  // if either significator is stationary-retrograde (speed < 0), the fast
  // approach that would perfect the aspect is undone.
  return qP.speed < 0 || tP.speed < 0
}

export interface MoonMotion {
  separatingFrom: { planet: PlanetName; aspect: string } | null
  applyingTo: { planet: PlanetName; aspect: string } | null
}

/**
 * The Moon as witness: what she last separated from (the recent past of the
 * matter) and what she next applies to (its near future). Lilly reads the
 * Moon's next application as a primary testimony.
 */
export function moonMotion(chart: Chart): MoonMotion {
  const moon = chart.planets.Moon
  let separating: MoonMotion['separatingFrom'] = null
  let applying: MoonMotion['applyingTo'] = null
  let bestApplyOrb = Infinity
  let bestSepOrb = Infinity
  for (const name of ALL) {
    if (name === 'Moon') continue
    const a = findAspect(moon, chart.planets[name])
    if (!a) continue
    if (a.applying) {
      if (a.orb < bestApplyOrb) { bestApplyOrb = a.orb; applying = { planet: name, aspect: a.type } }
    } else {
      if (a.orb < bestSepOrb) { bestSepOrb = a.orb; separating = { planet: name, aspect: a.type } }
    }
  }
  return { separatingFrom: separating, applyingTo: applying }
}

/** Benefic / malefic nature (traditional). Sun & Moon are neutral lights. */
export function nature(planet: PlanetName): 'benefic'|'malefic'|'neutral' {
  if (planet === 'Jupiter' || planet === 'Venus') return 'benefic'
  if (planet === 'Saturn' || planet === 'Mars') return 'malefic'
  return 'neutral'
}
