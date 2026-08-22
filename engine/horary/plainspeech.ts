import type { Chart, PlanetName } from '../types'
import { houseOf } from '../astro/houses'
import { houseMeaning } from './interpretation'

/**
 * ─── THIS FILE IS NOT LILLY ─────────────────────────────────────────────────
 *
 * It says in ordinary words what the figure has already been judged to mean,
 * for a querent who does not know what a house is. Nothing here decides
 * anything: every sentence is drawn from a fact the engine has already
 * established, and the astrological reading stands unchanged beside it.
 *
 * WHAT LILLY HAS: the house a significator stands in is a testimony about the
 * matter in its own right, and he reads it constantly. "The Lord of the 10th in
 * the 1st ... yet shall he attain the Place or Office desired" — the placement
 * settles the outcome with no aspect at all. "The Lord of the 7th in the 4th,
 * it is his Father, or some old Body"; "the Lord of the 6th if he be in the
 * 6th, 8th or 12th, denotes a Disease not easily curable." The house says
 * through what the matter runs, who is involved, and how it ends.
 *
 * WHAT LILLY DOES NOT HAVE: one table covering every question. His are written
 * for particular demands — who stole the goods, where they lie, what manner of
 * man the husband will be. Generalising them to any question at all is ours,
 * and it is why this file is not the canon.
 *
 * The rule that keeps it honest: every phrase below answers to a fact the
 * engine computed. None is invented at the point of writing, and none may be
 * chosen by the narrator, which states what it is given and decides nothing.
 */

/**
 * What a house stands for, said the way a person would say it.
 *
 * Two forms, because the same words cannot do both jobs. The full one is a
 * sentence's worth of what the house covers; the short one is a noun phrase
 * that reads correctly when another sentence is built around it. Splicing the
 * long form into a clause produced "you stand where other people's money,
 * debts, what you stand to inherit, or what you dread decides things".
 */
interface HousePlainly { full: string; short: string }

const PLAINLY: Record<number, HousePlainly> = {
  1: { full: 'you yourself — your own health, your own doing', short: 'your own person' },
  2: { full: 'your money and what you own', short: 'your own money' },
  3: { full: 'people close at hand — a sibling, a neighbour — or a short trip, a message, something said', short: 'people close at hand and word passing between them' },
  4: { full: 'home, family, property, or how a thing finally ends', short: 'home and family' },
  5: { full: 'children, pleasure, or something you are taking a chance on', short: 'children and chances taken' },
  6: { full: 'daily work, service, illness, or the people who work for you', short: 'daily work and health' },
  7: { full: 'the other side — a partner, an opponent, an agreement to be struck with someone else', short: 'the other side of a bargain' },
  8: { full: "other people's money, debts, what you stand to inherit, or what you dread", short: "other people's money" },
  9: { full: 'distance — travel, foreign places, study, law, or the long view', short: 'distance and the long view' },
  10: { full: 'work and standing — your profession, your employer, your reputation', short: 'your work and standing' },
  11: { full: 'friends, allies, and what you are hoping for', short: 'friends and allies' },
  12: { full: 'what is hidden — quiet opposition, confinement, or the way you get in your own way', short: 'what is hidden from you' },
}

export function houseMeansPlainly(house: number): string {
  return PLAINLY[house].full
}

/** The same, as a noun phrase other sentences can be built around. */
export function houseInShort(house: number): string {
  return PLAINLY[house].short
}

export interface PlainSpeech {
  /** Through what the matter runs, from the house its significator stands in. */
  matterRunsThrough: string
  /** Where the querent stands, from the house of their significator. */
  querentStands: string
  /** How it comes about, or why it does not. */
  howItComesAbout: string
  /** What gets in the way, in ordinary words. Empty when nothing does. */
  whatHinders: string[]
}

export interface PlainInput {
  perfection: 'direct' | 'translation' | 'collection' | 'antiscion' | null
  destroyed: boolean
  verdict: 'yes' | 'no' | 'qualified'
}

export function plainSpeechFor(
  chart: Chart,
  querent: PlanetName,
  quesited: PlanetName,
  questionHouse: number,
  input: PlainInput,
): PlainSpeech {
  const quesitedHouse = houseOf(chart.planets[quesited].lon, chart.cusps)
  const querentHouse = houseOf(chart.planets[querent].lon, chart.cusps)

  const matterRunsThrough =
    `What you are asking about is bound up with ${houseMeansPlainly(quesitedHouse)}.`

  const querentStands =
    `Your own footing in this rests on ${houseInShort(querentHouse)}.`

  // How the parties come together, in the terms a person would use. The
  // engine's three routes to perfection are three different pieces of advice:
  // settle it yourselves, find someone to carry it, or wait on a third party
  // who holds both ends.
  let howItComesAbout: string
  if (input.destroyed) {
    howItComesAbout =
      'It was on its way to happening, and something got in first and cut across it.'
  } else if (input.perfection === 'direct') {
    howItComesAbout = 'This is settled directly, between you and the other side.'
  } else if (input.perfection === 'translation') {
    howItComesAbout =
      'It will not happen by itself: someone else has to carry it between you.'
  } else if (input.perfection === 'collection') {
    howItComesAbout =
      'Neither of you brings this about. It holds only because a third party gathers it up, and it depends on them.'
  } else if (input.perfection === 'antiscion') {
    howItComesAbout =
      'The connection is there, but not out in the open — it works quietly rather than by anything declared.'
  } else {
    howItComesAbout =
      'There is no connection between you and the thing asked about — nothing links the two, so there is nothing to act on.'
  }

  return { matterRunsThrough, querentStands, howItComesAbout, whatHinders: [] }
}

/**
 * What a hindrance means in ordinary words: the house it comes from, said as a
 * quarter of life rather than a number.
 */
export function hindranceInPlainWords(
  planetHouse: number,
  questionHouse: number,
): string {
  const { source } = houseMeaning(planetHouse, questionHouse)
  return `The trouble comes by way of ${houseInShort(planetHouse)} — what the chart calls ${source}.`
}
