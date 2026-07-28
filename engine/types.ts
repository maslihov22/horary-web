export type PlanetName = 'Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn'

export const PLANET_NAMES: PlanetName[] =
  ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']

export type SignName =
  'Aries'|'Taurus'|'Gemini'|'Cancer'|'Leo'|'Virgo'|
  'Libra'|'Scorpio'|'Sagittarius'|'Capricorn'|'Aquarius'|'Pisces'

export const SIGN_NAMES: SignName[] = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
]

export interface PlanetPos { name: PlanetName; lon: number; speed: number }

export interface Chart {
  jde: number
  planets: Record<PlanetName, PlanetPos>
  cusps: number[] // cusps[1..12], index 0 unused
}

export type AspectType = 'conjunction'|'sextile'|'square'|'trine'|'opposition'

export interface Verdict {
  verdict: 'yes'|'no'|'qualified'
  confidence: number
  reasons: string[]
  timing: string | null
}
