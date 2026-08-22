import type { Chart, PlanetName } from '../types'
import { separation } from '../astro/angles'
import { base, precess, coord } from 'astronomia'

// The fixed stars Lilly keeps in play.
//
// He does not treat them as decoration: his own worked ledgers in Book II
// score a planet for standing with one, "In Conjunct. with Spica Virgo, or
// within 5 deg. 5" and "In Q with Cor Leonis, in 24 degr. Leo 6". A star acts
// by bodily contact rather than by aspect, which is why the orb below is
// narrow — nothing like a planetary orb.
//
// Positions are stored for J2000 and precessed to the chart's date. Storing
// today's longitudes instead would rot: general precession carries them about
// 1°23' a century, so a hardcoded table quietly drifts out of the orb it was
// written for.

export type StarName =
  | 'Algol' | 'Regulus' | 'Spica' | 'Aldebaran' | 'Antares' | 'Pleiades'

export const STAR_NAMES: StarName[] =
  ['Algol', 'Regulus', 'Spica', 'Aldebaran', 'Antares', 'Pleiades']

/** J2000 ecliptic position, degrees. */
interface StarPos { lon: number; lat: number; nature: string }

const STARS: Record<StarName, StarPos> = {
  // Beta Persei — the Gorgon's head. Lilly's table scores a partile conjunction
  // with "Caput Algol" among the heaviest debilities.
  Algol: { lon: 56.1667, lat: 22.4333, nature: 'violence and misfortune' },
  // Alpha Leonis, Cor Leonis — the Lion's heart, royal.
  Regulus: { lon: 149.8333, lat: 0.4667, nature: 'honour and preferment' },
  // Alpha Virginis — Spica Virgo, the most fortunate of the fixed stars.
  Spica: { lon: 203.8333, lat: -2.05, nature: 'fortune and protection' },
  // Alpha Tauri, one of the four royal stars, martial in nature.
  Aldebaran: { lon: 69.7833, lat: -5.4667, nature: 'martial honour, bought dearly' },
  // Alpha Scorpii, the rival of Mars.
  Antares: { lon: 249.7667, lat: -4.5667, nature: 'martial honour, bought dearly' },
  // Alcyone, brightest of the Pleiades — "the weeping sisters".
  Pleiades: { lon: 59.9333, lat: 4.05, nature: 'sorrow and weeping' },
}

/**
 * Where the star stands at the chart's date.
 *
 * The epoch arguments are Julian YEARS, not Julian Days — passing a JD here
 * silently returns a position more than a hundred degrees out, which is
 * exactly the kind of plausible wrong answer Gate #3 exists to catch.
 */
export function starLongitude(star: StarName, jde: number): number {
  const s = STARS[star]
  const d2r = Math.PI / 180
  const ecl = new coord.Ecliptic(s.lon * d2r, s.lat * d2r)
  const out = precess.eclipticPosition(ecl, 2000.0, base.JDEToJulianYear(jde), 0, 0)
  const deg = (out.lon * 180) / Math.PI
  return ((deg % 360) + 360) % 360
}

export interface StarContact {
  star: StarName
  nature: string
  detail: string
}

// Lilly's own figure: a star tells "within 5 deg." of the planet's body.
const STAR_ORB = 5

/** Which of Lilly's stars the planet stands with. */
export function starContacts(planet: PlanetName, chart: Chart): StarContact[] {
  const lon = chart.planets[planet].lon
  const out: StarContact[] = []

  for (const star of STAR_NAMES) {
    if (separation(lon, starLongitude(star, chart.jde)) > STAR_ORB) continue
    out.push({
      star,
      nature: STARS[star].nature,
      detail: `${planet} stands with ${star}, a star of ${STARS[star].nature}.`,
    })
  }

  return out
}
