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

export function essentialDignity(planet: PlanetName, lon: number): number {
  const sign = signOf(lon)
  if (DOMICILE[sign] === planet) return 5
  if (EXALT[sign] === planet) return 4
  if (DETRIMENT[planet].includes(sign)) return -5
  if (FALL[planet] === sign) return -4
  if (TRIPLICITY[ELEMENT[sign]] === planet) return 3
  return 0
}
