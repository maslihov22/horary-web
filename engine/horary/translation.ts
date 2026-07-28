import type { PlanetPos } from '../types'
import { normalizeDeg, separation } from '../astro/angles'
import { receives } from './receptions'

// Ptolemaic aspect angles used for translation links.
const ANGLES = [0, 60, 90, 120, 180]
// Interception orb for translation: wider than a partile hit — the translator
// only needs to be within the light of each significator (traditional moiety
// range), not exact. 10° covers Lilly's Jupiter→Sun link (9.25°).
const LINK_ORB = 10

export interface Translation {
  translator: PlanetPos['name']
  from: PlanetPos['name']
  to: PlanetPos['name']
  detail: string
}

// Nearest aspect orb between two longitudes, or null if none within `orb`.
function aspectOrb(a: number, b: number, orb: number): { angle: number; orb: number } | null {
  const s = separation(a, b)
  let best: { angle: number; orb: number } | null = null
  for (const ang of ANGLES) {
    const o = Math.abs(s - ang)
    if (o <= orb && (!best || o < best.orb)) best = { angle: ang, orb: o }
  }
  return best
}

// Is the link between translator and target "working" in Lilly's sense?
// Either applying, OR partile (orb < 1°) even if separating — Lilly counts a
// partile aspect as a strong argument for performance regardless of direction.
function linkWorks(tr: PlanetPos, other: PlanetPos): boolean {
  const hit = aspectOrb(tr.lon, other.lon, LINK_ORB)
  if (!hit) return false
  if (hit.orb < 1) return true // partile — works even if separating (Lilly)
  // else require applying: separation moving toward the exact aspect
  const dt = 0.05
  const future = separation(
    normalizeDeg(tr.lon + tr.speed * dt),
    normalizeDeg(other.lon + other.speed * dt),
  )
  const now = separation(tr.lon, other.lon)
  return Math.abs(future - hit.angle) < Math.abs(now - hit.angle)
}

// Translation of light: a swifter third planet that carries the light of one
// significator to the other. It must aspect BOTH significators (each link
// working per linkWorks) and move faster than both — it collects from one and
// applies to the other.
export interface Collection {
  collector: PlanetPos['name']
  detail: string
}

// Collection of light, in Lilly's words: "when as the two principall
// Significators doe not behold one another, but both cast their severall
// aspects to a more weighty Planet than themselves, and they both receive him
// in some of their essentiall dignities; then shall that Planet who thus
// collects both their lights, bring the thing demanded to perfection."
//
// Three conditions, all required — the reception clause is the one most often
// dropped, and without it the rule would fire on almost any slow planet caught
// between the significators.
export function findCollection(
  sig1: PlanetPos,
  sig2: PlanetPos,
  others: PlanetPos[],
): Collection | null {
  for (const col of others) {
    if (col.name === sig1.name || col.name === sig2.name) continue

    // "both cast their severall aspects to" — each significator applies to it.
    if (!linkWorks(sig1, col) || !linkWorks(sig2, col)) continue

    // "a more weighty Planet than themselves" — heavier means slower moving.
    if (Math.abs(col.speed) >= Math.abs(sig1.speed)) continue
    if (Math.abs(col.speed) >= Math.abs(sig2.speed)) continue

    // "they both receive him in some of their essentiall dignities".
    if (!receives(sig1, col) || !receives(sig2, col)) continue

    return {
      collector: col.name,
      detail: `${col.name}, weightier than both and received by each, collects their light — a third party concludes what the principals cannot.`,
    }
  }
  return null
}

export function findTranslation(
  sig1: PlanetPos,
  sig2: PlanetPos,
  others: PlanetPos[],
): Translation | null {
  for (const tr of others) {
    if (tr.name === sig1.name || tr.name === sig2.name) continue
    const links1 = aspectOrb(tr.lon, sig1.lon, LINK_ORB)
    const links2 = aspectOrb(tr.lon, sig2.lon, LINK_ORB)
    if (!links1 || !links2) continue
    if (!linkWorks(tr, sig1) || !linkWorks(tr, sig2)) continue
    // translator must be swifter than both significators to carry light
    if (Math.abs(tr.speed) <= Math.abs(sig1.speed) &&
        Math.abs(tr.speed) <= Math.abs(sig2.speed)) continue
    // determine direction: light carried FROM the one it's separating from
    // TO the one it's applying to (fallback: from sig2 to sig1).
    return {
      translator: tr.name,
      from: sig2.name,
      to: sig1.name,
      detail: `${tr.name} translates the light of ${sig2.name} to ${sig1.name}.`,
    }
  }
  return null
}
