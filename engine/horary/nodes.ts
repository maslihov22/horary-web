import { moonposition } from 'astronomia'
import type { Chart, PlanetName } from '../types'
import { normalizeDeg, radToDeg, separation } from '../astro/angles'
import { nature } from './testimonies'

/**
 * The Dragon's Head and Tail — the Moon's nodes. Lilly's tables are of the
 * MEAN node, so that is what is used here.
 *
 * The Head increases whatever it joins: a fortune becomes more fortunate, an
 * infortune more harmful. The Tail runs the other way, and the inversion is
 * the whole of the rule — Lilly: the Tail "is evill when joyned with good
 * Planets, and good when in conjunction with the malignant Planets."
 */
export interface NodeContact {
  node: 'head' | 'tail'
  effect: 'increases' | 'harms' | 'lessens the malice' | 'unclaimed'
  detail: string
}

// Lilly allows the nodes a wide orb; 12° is his figure for a bodily
// conjunction with the Head or Tail.
const NODE_ORB = 12

/**
 * The Head is the ascending node, where the Moon crosses north; the Tail is
 * always the point opposite it, so it is not computed separately.
 *
 * astronomia hands back the mean ascending node in radians.
 */
export function nodePositions(jde: number): { head: number; tail: number } {
  const head = normalizeDeg(radToDeg(moonposition.node(jde)))
  return { head, tail: normalizeDeg(head + 180) }
}

export function nodeContact(planet: PlanetName, chart: Chart): NodeContact | null {
  const { head, tail } = nodePositions(chart.jde)
  const p = chart.planets[planet].lon

  const onHead = separation(p, head) <= NODE_ORB
  const onTail = separation(p, tail) <= NODE_ORB
  if (!onHead && !onTail) return null

  if (onHead) {
    return {
      node: 'head',
      effect: 'increases',
      detail: `${planet} is joined to the Dragon's Head, which increases whatever it touches.`,
    }
  }

  // The Tail's reading depends entirely on what it has hold of. Only the
  // infortunes are relieved by it; a benefic — and, for want of a better
  // reading, a neutral planet — is spoiled.
  const n = nature(planet)
  // Lilly gives the Tail's inversion for two cases and stops there: it "is
  // evill when joyned with good Planets, and good when in conjunction with the
  // malignant Planets." Mercury and the two lights are neither, and he says
  // nothing about them — so the contact is reported and the effect left
  // unclaimed, rather than guessed at by falling through to one branch.
  if (n === 'malefic') {
    return {
      node: 'tail',
      effect: 'lessens the malice',
      detail: `${planet} is joined to the Dragon's Tail, which lessens the malice of an infortune.`,
    }
  }
  if (n === 'benefic') {
    return {
      node: 'tail',
      effect: 'harms',
      detail: `${planet} is joined to the Dragon's Tail, which is evil upon a fortune.`,
    }
  }
  return {
    node: 'tail',
    effect: 'unclaimed',
    detail: `${planet} is joined to the Dragon's Tail.`,
  }
}
