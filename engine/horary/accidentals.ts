import type { Chart, PlanetName } from '../types'
import { PLANET_NAMES } from '../types'
import { normalizeDeg, separation } from '../astro/angles'
import { nature } from './testimonies'
import { houseOf } from '../astro/houses'
import type { Affliction, FigureCircumstances, SideCondition } from '../types'
import { isPeregrine } from './rulerships'
import { nodeContact } from './nodes'
import { starContacts } from './fixedstars'
import { partOfFortune, fortuneHouse } from './fortune'

/**
 * Accidental dignity — a planet's condition by circumstance rather than by
 * sign. Lilly's table (CA p.115) scores these; this engine does not score,
 * it reports the conditions themselves and lets the judgment read them.
 */

export type HouseStrength = 'angular' | 'succedent' | 'cadent'

const ANGULAR = [1, 4, 7, 10]
const SUCCEDENT = [2, 5, 8, 11]

/**
 * A planet on an angle acts strongly and soon; in a succedent house it acts,
 * but later; in a cadent house it is weak and its business drags.
 */
export function houseStrength(house: number): HouseStrength {
  if (ANGULAR.includes(house)) return 'angular'
  if (SUCCEDENT.includes(house)) return 'succedent'
  return 'cadent'
}

/**
 * Lilly's accidental fortitude by house (CA p.115).
 *
 * This grades a planet's standing for the REPORT, not for the judgment. He
 * keeps such a ledger himself in Chapter XXVIII — and having kept it, decides
 * the question by testimony instead, never by comparing the totals. The
 * engine follows him in both halves of that: the number describes, the
 * testimonies decide.
 *
 * Note that the angles are not equal here, and that the 11th — succedent by
 * the threefold division — he rates with them.
 */
const HOUSE_FORTITUDE: Record<number, number> = {
  10: 5, 1: 5,
  7: 4, 4: 4, 11: 4,
  2: 3, 5: 3,
  9: 2,
  3: 1,
  12: -5,
  8: -2, 6: -2,
}

export function houseFortitude(house: number): number {
  return HOUSE_FORTITUDE[house] ?? 0
}

export type SolarCondition = 'cazimi' | 'combust' | 'under-beams' | 'free'

// Lilly's boundaries. They nest, so they are tested narrowest first.
const CAZIMI_DEG = 17 / 60   // 17 minutes
const COMBUST_DEG = 8.5      // 8°30'
const BEAMS_DEG = 17

/**
 * How the Sun treats the planet. Lilly: a planet within 17 minutes of the Sun
 * is "in the heart of the Sun, or in Cazimi", and fortified by it; within
 * 8°30' it is combust, which he counts among the greatest debilities; out to
 * 17° it is under the sunbeams, weakened but not burnt.
 *
 * The Sun cannot be combust of itself.
 */
export function solarCondition(planet: PlanetName, chart: Chart): SolarCondition {
  if (planet === 'Sun') return 'free'

  const diff = separation(chart.planets[planet].lon, chart.planets.Sun.lon)

  if (diff <= CAZIMI_DEG) return 'cazimi'
  if (diff <= COMBUST_DEG) return 'combust'
  if (diff <= BEAMS_DEG) return 'under-beams'
  return 'free'
}

/**
 * Retrogradation as a standing condition, not as the event of refranation
 * (which testimonies.ts already reads). A retrograde planet goes back over
 * ground it has covered: the matter it signifies returns, repeats, or undoes
 * itself.
 *
 * The Sun and Moon never turn retrograde; if an ephemeris ever hands us a
 * negative speed for them it is an error, not a testimony.
 */
export function isRetrograde(planet: PlanetName, chart: Chart): boolean {
  if (planet === 'Sun' || planet === 'Moon') return false
  return chart.planets[planet].speed < 0
}

export type MotionSpeed = 'swift' | 'slow'

/**
 * Mean daily motion, degrees per day.
 *
 * Lilly counts a planet swift when it moves faster than its mean (CA p.115)
 * but prints no table of means — those come from the ephemeris. Saturn,
 * Jupiter, Mars, the Sun and the Moon are simply 360° over the orbital period.
 *
 * Mercury and Venus are a reading rather than a quotation. Their geocentric
 * mean equals the Sun's, since neither ever departs from him; measured that
 * way almost every direct Mercury counts as swift and the testimony says
 * nothing. These are the mean DIRECT speeds instead, retrograde arcs excluded,
 * which is what the astrological tables quote and what makes the distinction
 * bite: a hurrying Mercury against a crawling one.
 */
const MEAN_MOTION: Record<PlanetName, number> = {
  Moon: 13 + 11 / 60,
  Mercury: 1 + 23 / 60,
  Venus: 1 + 12 / 60,
  Sun: 59 / 60,
  Mars: 31 / 60,
  Jupiter: 5 / 60,
  Saturn: 2 / 60,
}

/**
 * Swift business or slow. A retrograde planet falls out as slow without a
 * special case — its speed is negative and every mean is positive — and that
 * is the right reading: it is not going about its business at all, it is
 * going back.
 */
export function motionSpeed(planet: PlanetName, chart: Chart): MotionSpeed {
  return chart.planets[planet].speed > MEAN_MOTION[planet] ? 'swift' : 'slow'
}

export interface Companion {
  planet: PlanetName
  nature: 'benefic' | 'malefic'
}

// A bodily conjunction, not an aspect: the planets sit together. 8° is the
// traditional moiety for reading one planet as company for another.
const BODILY_ORB = 8

/**
 * Who keeps the planet company. Lilly counts conjunction with Jupiter or Venus
 * among the accidental dignities and conjunction with Saturn or Mars among the
 * debilities.
 *
 * The Sun is left out: his company is already judged by solarCondition, and
 * counting it twice would charge the same fact against the planet twice.
 */
export function conjunctions(planet: PlanetName, chart: Chart): Companion[] {
  const target = chart.planets[planet].lon
  const out: Companion[] = []

  for (const other of PLANET_NAMES) {
    // Naming the Sun is belt and braces: he is neutral, so the filter below
    // would drop him anyway. The guard states the intent, and holds if the
    // lights are ever given a nature.
    if (other === planet || other === 'Sun') continue
    const n = nature(other)
    if (n === 'neutral') continue

    const diff = separation(chart.planets[other].lon, target)
    if (diff <= BODILY_ORB) out.push({ planet: other, nature: n })
  }

  return out
}

export type Orientality = 'oriental' | 'occidental'

/**
 * Oriental — rising before the Sun; occidental — after him. Lilly counts
 * Saturn, Jupiter and Mars dignified when oriental, Mercury and Venus when
 * occidental.
 *
 * Measured by which semicircle of the zodiac the planet occupies relative to
 * the Sun: within the 180° behind him it rises first. The lights have no
 * orientality of their own.
 */
export function orientality(planet: PlanetName, chart: Chart): Orientality | null {
  if (planet === 'Sun' || planet === 'Moon') return null
  const ahead = normalizeDeg(chart.planets[planet].lon - chart.planets.Sun.lon)
  return ahead > 180 ? 'oriental' : 'occidental'
}

const PHRASE: Record<Affliction, string> = {
  'combust': 'burnt up by the Sun and hidden from sight',
  'under-beams': 'under the sunbeams, obscured',
  'retrograde': 'retrograde, going back over its own ground',
  'slow': 'slow in motion, dragging its business',
  'cadent': 'in a cadent house, weak to act',
  'in-a-house-of-debility': 'in a house that weakens it',
  'with-infortune': 'in company with an infortune',
  'peregrine': 'peregrine, a stranger where it stands, with no dignity to support it',
}

/**
 * A planet's whole accidental condition, gathered. Nothing here is scored:
 * the conditions are reported as they stand and the judgment reads them.
 */
export function conditionOf(planet: PlanetName, chart: Chart): SideCondition {
  const house = houseOf(chart.planets[planet].lon, chart.cusps)
  const strength = houseStrength(house)
  const solar = solarCondition(planet, chart)
  const companions = conjunctions(planet, chart)
  const lon = chart.planets[planet].lon
  const peregrine = isPeregrine(planet, lon)
  const node = nodeContact(planet, chart)
  const stars = starContacts(planet, chart)

  const afflictions: Affliction[] = []
  if (solar === 'combust') afflictions.push('combust')
  if (solar === 'under-beams') afflictions.push('under-beams')
  if (isRetrograde(planet, chart)) afflictions.push('retrograde')
  if (motionSpeed(planet, chart) === 'slow') afflictions.push('slow')
  if (strength === 'cadent') afflictions.push('cadent')
  // The threefold division cannot say everything Lilly's table does. He
  // debilitates a planet in the 12th by 5 and in the 8th and 6th by 2 (CA
  // p.115) — and the 8th is SUCCEDENT, so by the division alone a significator
  // in the house of death read as unremarkable and was reported sound. The 6th
  // is cadent already and so already counted; only the 8th and 12th are missed.
  if (house === 8 || house === 12) afflictions.push('in-a-house-of-debility')
  if (companions.some(c => c.nature === 'malefic')) afflictions.push('with-infortune')
  if (peregrine) afflictions.push('peregrine')

  const cazimi = solar === 'cazimi'

  let detail: string
  if (cazimi) {
    detail = `${planet} is in the heart of the Sun, fortified above his ordinary strength.`
  } else if (afflictions.length === 0) {
    detail = `${planet} stands sound in the ${ordinal(house)} house, under no impediment.`
  } else {
    detail = `${planet} in the ${ordinal(house)} house is ${afflictions.map(a => PHRASE[a]).join(', ')}.`
  }

  // The node and the stars are not afflictions: the Tail can help a malefic
  // and a star may be of either nature, so they are told, not counted.
  const extra = [node?.detail, ...stars.map(s => s.detail)].filter(Boolean)
  if (extra.length) detail = [detail, ...extra].join(' ')

  return {
    planet, house, strength, afflictions, cazimi,
    peregrine, orientality: orientality(planet, chart), node, stars,
    fortitude: houseFortitude(house),
    detail,
  }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * The circumstances of the figure as a whole, as against one side's condition.
 *
 * The Part of Fortune is cast from the Ascendant and both lights, so it
 * belongs to the figure and not to either significator — which is why it is
 * reported here rather than on a SideCondition.
 */
export function circumstancesOf(chart: Chart): FigureCircumstances {
  return {
    partOfFortune: partOfFortune(chart),
    partOfFortuneHouse: fortuneHouse(chart),
  }
}
