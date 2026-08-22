import type { Chart } from '../types'
import { normalizeDeg } from '../astro/angles'
import { houseOf } from '../astro/houses'

/**
 * The Part of Fortune: Ascendant + Moon − Sun.
 *
 * NOT reversed for night charts. The medieval tradition after Dorotheus swaps
 * the Sun and Moon by sect, and most modern software follows it — but Lilly
 * sides with Ptolemy and uses this one formula in every figure. Reversing it
 * would put the engine at odds with the book it implements.
 *
 * Lilly reads the Part chiefly in questions of money and substance.
 */
export function partOfFortune(chart: Chart): number {
  return normalizeDeg(chart.cusps[1] + chart.planets.Moon.lon - chart.planets.Sun.lon)
}

export function fortuneHouse(chart: Chart): number {
  return houseOf(partOfFortune(chart), chart.cusps)
}
