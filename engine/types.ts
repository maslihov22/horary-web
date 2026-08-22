import type { Orientality } from './horary/accidentals'
import type { NodeContact } from './horary/nodes'
import type { StarContact } from './horary/fixedstars'

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
  /**
   * How the figure stands, told apart from what it decides. Lilly never gives
   * a bare answer: he sets out the state of each significator and what stands
   * in the way, and only then judges. The fields above are that judgment; this
   * is the account it was drawn from, and nothing in it decides anything.
   */
  circumstances: Circumstances
}

export type ObstacleKind = 'prohibition' | 'besieging' | 'affliction'

export interface Obstacle {
  planet: PlanetName
  house: number
  kind: ObstacleKind
  source: string
  alsoMeans: string[]
  detail: string
}

export type Affliction =
  | 'combust' | 'under-beams' | 'retrograde' | 'slow' | 'cadent' | 'with-infortune'
  | 'peregrine' | 'in-a-house-of-debility'

export interface SideCondition {
  planet: PlanetName
  house: number
  strength: 'angular' | 'succedent' | 'cadent'
  afflictions: Affliction[]
  cazimi: boolean
  peregrine: boolean
  orientality: Orientality | null
  node: NodeContact | null
  stars: StarContact[]
  /**
   * Lilly's numeric grade for the house (CA p.115). It DESCRIBES the planet's
   * standing in the report; it never decides the question. Do not read this
   * in judge() — the testimonies decide there, as they do in Lilly.
   */
  fortitude: number
  detail: string
}

/**
 * The circumstances of the whole figure, as against one side's condition.
 *
 * The Part of Fortune belongs here rather than on a SideCondition: it is a
 * point of the figure, cast from the Ascendant and both lights, and not the
 * property of either significator. Lilly reads it chiefly in questions of
 * money and substance.
 */
export interface FigureCircumstances {
  partOfFortune: number
  partOfFortuneHouse: number
}

/**
 * The figure's circumstances together with the two sides the judgment took and
 * what it found in the way. Split from FigureCircumstances because only the
 * judgment knows the latter: circumstancesOf() can read the whole chart and
 * still not say which planet stood for the querent.
 */
export interface PlainSpeech {
  matterRunsThrough: string
  querentStands: string
  howItComesAbout: string
  whatHinders: string[]
}

export interface Circumstances extends FigureCircumstances {
  /** The querent's significator as judged — the Moon where she was taken in. */
  querent: SideCondition
  quesited: SideCondition
  /**
   * What the judgment found standing in the way: the prohibiting planet, and
   * the infortunes besieging either significator. Empty is the ordinary case
   * and means nothing was found, not that nothing was looked for.
   */
  obstacles: Obstacle[]
  /** The same figure said in ordinary words, for a querent who knows no astrology. */
  plainSpeech: PlainSpeech
}
