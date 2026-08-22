import type { PlanetName, SignName } from '../types'
import { SIGN_NAMES } from '../types'
import { normalizeDeg } from '../astro/angles'

export function signOf(lon: number): SignName {
  return SIGN_NAMES[Math.floor(normalizeDeg(lon) / 30)]
}

const DOMICILE: Record<SignName, PlanetName> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
}
export function rulerOfSign(sign: SignName): PlanetName { return DOMICILE[sign] }

export function rulerOfHouse(house: number, cusps: number[]): PlanetName {
  return rulerOfSign(signOf(cusps[house]))
}

// Exaltation, detriment, fall tables (Lilly)
const EXALT: Partial<Record<SignName, PlanetName>> = {
  Aries: 'Sun', Taurus: 'Moon', Cancer: 'Jupiter', Virgo: 'Mercury',
  Libra: 'Saturn', Capricorn: 'Mars', Pisces: 'Venus',
}
const DETRIMENT: Record<PlanetName, SignName[]> = {
  Sun: ['Aquarius'], Moon: ['Capricorn'], Mercury: ['Sagittarius','Pisces'],
  Venus: ['Aries','Scorpio'], Mars: ['Taurus','Libra'],
  Jupiter: ['Gemini','Virgo'], Saturn: ['Cancer','Leo'],
}
const FALL: Partial<Record<PlanetName, SignName>> = {
  Sun: 'Libra', Moon: 'Scorpio', Jupiter: 'Capricorn',
  Mercury: 'Pisces', Venus: 'Virgo', Saturn: 'Aries', Mars: 'Cancer',
}

// Triplicity day-rulers (Lilly) — enough to score significator presence.
const TRIPLICITY: Record<'fire'|'earth'|'air'|'water', PlanetName> = {
  fire: 'Sun', earth: 'Venus', air: 'Saturn', water: 'Mars',
}
const ELEMENT: Record<SignName, 'fire'|'earth'|'air'|'water'> = {
  Aries:'fire',Leo:'fire',Sagittarius:'fire',
  Taurus:'earth',Virgo:'earth',Capricorn:'earth',
  Gemini:'air',Libra:'air',Aquarius:'air',
  Cancer:'water',Scorpio:'water',Pisces:'water',
}

// Does `planet` hold any essential dignity over the given DEGREE? Lilly
// receives a planet in any of his dignities, and he means all five:
//
//   "It may be by Triplicity, term or face, or any essentiall dignity; as
//    Venus in Aries, and Sun in Taurus; here is reception by triplicity...
//    so Venus in the 24 of Aries, and Mars in the 16 of Gemini; here is
//    reception by term, Mars being in the terms of Venus, and she in his
//    terms."  (CA p.112)
//
// He does not merely list the minor dignities — he works an example in
// degrees, which is why this takes a longitude rather than a sign: term and
// face are properties of the degree, and reception by them cannot be
// expressed sign-wide.
//
// Domicile remains "the strongest and best of all receptions" in his words;
// the engine records that strength through essentialDignity, not here. This
// answers only whether the host receives the guest at all.
export function hasDignityIn(planet: PlanetName, lon: number): boolean {
  const sign = signOf(lon)
  return DOMICILE[sign] === planet
    || EXALT[sign] === planet
    || TRIPLICITY[ELEMENT[sign]] === planet
    || termRuler(lon) === planet
    || faceRuler(lon) === planet
}

export function essentialDignity(planet: PlanetName, lon: number): number {
  const sign = signOf(lon)
  if (DOMICILE[sign] === planet) return 5
  if (EXALT[sign] === planet) return 4
  if (DETRIMENT[planet].includes(sign)) return -5
  if (FALL[planet] === sign) return -4
  if (TRIPLICITY[ELEMENT[sign]] === planet) return 3
  if (termRuler(lon) === planet) return 2
  if (faceRuler(lon) === planet) return 1
  return 0
}

/**
 * Ptolemy's terms, which Lilly uses. Each entry is [ruler, degree the term
 * ENDS at], so Aries reads: Jupiter 0-6, Venus 6-14, Mercury 14-21, Mars
 * 21-26, Saturn 26-30.
 *
 * Verified: every sign sums to 30°, five distinct planets per sign, no
 * luminaries, and the per-planet totals across the zodiac are Jupiter 72°,
 * Venus 96°, Mercury 84°, Mars 60°, Saturn 48° — the classical figures. Re-run
 * that arithmetic if this table is ever touched.
 */
const TERMS: Record<SignName, [PlanetName, number][]> = {
  Aries: [['Jupiter',6],['Venus',14],['Mercury',21],['Mars',26],['Saturn',30]],
  Taurus: [['Venus',8],['Mercury',15],['Jupiter',21],['Saturn',25],['Mars',30]],
  Gemini: [['Mercury',7],['Jupiter',13],['Venus',21],['Mars',26],['Saturn',30]],
  Cancer: [['Mars',5],['Jupiter',11],['Venus',19],['Mercury',26],['Saturn',30]],
  Leo: [['Saturn',4],['Mercury',11],['Jupiter',17],['Venus',25],['Mars',30]],
  Virgo: [['Mercury',7],['Venus',15],['Jupiter',21],['Saturn',25],['Mars',30]],
  Libra: [['Venus',8],['Saturn',12],['Mars',17],['Mercury',24],['Jupiter',30]],
  Scorpio: [['Mars',5],['Jupiter',11],['Saturn',15],['Mercury',22],['Venus',30]],
  Sagittarius: [['Jupiter',6],['Venus',14],['Mercury',21],['Saturn',25],['Mars',30]],
  Capricorn: [['Saturn',4],['Mars',9],['Mercury',16],['Venus',24],['Jupiter',30]],
  Aquarius: [['Saturn',4],['Mercury',11],['Venus',19],['Jupiter',25],['Mars',30]],
  Pisces: [['Venus',8],['Jupiter',14],['Mercury',21],['Mars',26],['Saturn',30]],
}

export function termRuler(lon: number): PlanetName {
  const sign = signOf(lon)
  const deg = normalizeDeg(lon) % 30
  for (const [ruler, end] of TERMS[sign]) if (deg < end) return ruler
  return TERMS[sign][TERMS[sign].length - 1][0]
}

/**
 * Faces: three 10° decans per sign, the seven planets in Chaldean order
 * running continuously from 0° Aries.
 */
const CHALDEAN: PlanetName[] = ['Mars','Sun','Venus','Mercury','Moon','Saturn','Jupiter']

export function faceRuler(lon: number): PlanetName {
  return CHALDEAN[Math.floor(normalizeDeg(lon) / 10) % 7]
}

/**
 * A peregrine planet is a stranger where it stands: it holds none of the five
 * essential dignities there. Lilly counts this a debility in its own right,
 * and in questions of theft the peregrine planet in an angle is what points
 * out the thief.
 */
export function isPeregrine(planet: PlanetName, lon: number): boolean {
  const sign = signOf(lon)
  return DOMICILE[sign] !== planet
    && EXALT[sign] !== planet
    && TRIPLICITY[ELEMENT[sign]] !== planet
    && termRuler(lon) !== planet
    && faceRuler(lon) !== planet
}
