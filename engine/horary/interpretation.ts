/**
 * ─── THIS FILE IS NOT LILLY ─────────────────────────────────────────────────
 *
 * The house meanings below are his. The rule for choosing among them is ours,
 * and it is kept in its own file so nobody mistakes one for the other.
 *
 * WHAT LILLY HAS: each house signifies several things. The tenth is the
 * profession, the employer, those in authority, the mother, reputation.
 *
 * WHAT LILLY DOES NOT HAVE: a rule for picking which of them a given chart
 * means. He picks by sense — he reads the question, and he knows that an
 * obstacle in the tenth of a marriage question is more likely the mother than
 * the employer. A machine cannot do that.
 *
 * OUR RULE: when the obstructing planet stands in the same house the question
 * was asked of, that house is read in the question's own register. Otherwise
 * the house's primary signification is taken — the first in Lilly's own order,
 * which is not arbitrary. Everything else is handed over beside it, so the
 * reader sees what was not chosen.
 *
 * The choice is made here, in code a test can reach, and never by the narrator:
 * the narrator states what it is given and decides nothing.
 */

import { houseOf } from '../astro/houses'
import type { Chart, PlanetName, Obstacle, ObstacleKind } from '../types'

interface HouseSignification {
  /** How the house reads when the question is about it. */
  own: string
  /** Lilly's meanings, primary first. */
  meanings: string[]
}

const HOUSES: Record<number, HouseSignification> = {
  1: { own: 'you yourself', meanings: ['you yourself', 'your body and health', 'your own disposition'] },
  2: { own: 'the money asked about', meanings: ['your money and movable goods', 'your income', 'what you value'] },
  3: { own: 'the matter asked about', meanings: ['a brother or sister', 'a neighbour', 'short journeys', 'letters and rumours'] },
  4: { own: 'the property asked about', meanings: ['the father', 'land and houses', 'inheritance', 'the end of the matter'] },
  5: { own: 'the matter asked about', meanings: ['a child', 'pleasure and play', 'a wager'] },
  6: { own: 'the work asked about', meanings: ['sickness', 'servants and employees', 'daily labour', 'small animals'] },
  7: { own: 'the other party', meanings: ['the other party — a partner or spouse', 'an open enemy', 'a lawsuit', 'a thief'] },
  8: { own: 'the matter asked about', meanings: ['death and legacies', "the other party's money", 'debts', 'dread'] },
  9: { own: 'the matter asked about', meanings: ['a long journey', 'foreign parts', 'law and religion', 'study'] },
  10: { own: 'the profession itself', meanings: ['a superior — an employer, or those in authority', 'the mother', 'reputation and honour', 'the profession'] },
  11: { own: 'the matter asked about', meanings: ['a friend', 'hopes and wishes', "the employer's money"] },
  12: { own: 'the matter asked about', meanings: ['a secret enemy', 'confinement', 'self-undoing', 'hidden affliction'] },
}

export function houseMeaning(
  house: number,
  questionHouse: number,
): { source: string; alsoMeans: string[] } {
  const h = HOUSES[house]
  const source = house === questionHouse ? h.own : h.meanings[0]
  return { source, alsoMeans: h.meanings.filter(m => m !== source) }
}

// A hindrance is not only a planet: the reader wants to know whose interference
// it stands for. The house the obstructing planet occupies answers that, read
// through the rule above — and the meanings not chosen travel with it, so a
// reader who knows their own case can see the reading the machine passed over.
const KIND_PHRASE: Record<ObstacleKind, string> = {
  prohibition: 'steps in before the matter can perfect',
  besieging: 'hems the significator in',
  affliction: 'afflicts the significator',
}

export function describeObstacle(
  planet: PlanetName,
  kind: ObstacleKind,
  chart: Chart,
  questionHouse: number,
): Obstacle {
  const house = houseOf(chart.planets[planet].lon, chart.cusps)
  const { source, alsoMeans } = houseMeaning(house, questionHouse)
  return {
    planet, house, kind, source, alsoMeans,
    detail: `${planet} ${KIND_PHRASE[kind]}, and stands in the house of ${source}.`,
  }
}
