import type { PlanetPos } from '../types'
import { normalizeDeg } from '../astro/angles'

// Antiscia — Lilly, Christian Astrology: "The Antiscion Signs are those, which
// are of the same vertue and are equally distant from the first degree of the
// two Tropick Signs, Cancer, Capricorn, and in which degrees whilest the Sun is,
// the dayes and nights are of equall length."
//
// The axis is 0° Cancer / 0° Capricorn, so a degree reflects to 180° minus
// itself. Lilly's own worked example — Saturn at 20°35' Leo — lands at 9°25'
// Taurus, and his table of pairs (Gemini/Cancer, Leo/Taurus, Virgo/Aries,
// Libra/Pisces, Scorpio/Aquarius, Sagittarius/Capricorn) follows from it.
//
// A planet on another's antiscion is joined to it as if by a hidden conjunction;
// on the contra-antiscion, as if by opposition. Lilly reads these as real but
// secondary testimony, so the orb is tight — this is a relationship between
// degrees, not a Ptolemaic aspect with a moiety.
const ORB = 1.5

export function antiscion(lon: number): number {
  return normalizeDeg(180 - lon)
}

export function contraAntiscion(lon: number): number {
  return normalizeDeg(360 - lon)
}

export interface AntiscionLink {
  kind: 'antiscion' | 'contra-antiscion'
  orb: number
  detail: string
}

/** Are these two joined by antiscion or contra-antiscion? */
export function findAntiscionLink(a: PlanetPos, b: PlanetPos): AntiscionLink | null {
  const gap = (x: number, y: number) => {
    const d = Math.abs(normalizeDeg(x) - normalizeDeg(y)) % 360
    return d > 180 ? 360 - d : d
  }

  const toAntiscion = gap(antiscion(a.lon), b.lon)
  if (toAntiscion <= ORB) {
    return {
      kind: 'antiscion',
      orb: toAntiscion,
      detail: `${b.name} sits upon the antiscion of ${a.name} — they are joined in secret, as if by conjunction.`,
    }
  }

  const toContra = gap(contraAntiscion(a.lon), b.lon)
  if (toContra <= ORB) {
    return {
      kind: 'contra-antiscion',
      orb: toContra,
      detail: `${b.name} sits upon the contra-antiscion of ${a.name} — a hidden opposition between them.`,
    }
  }

  return null
}
