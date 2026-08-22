import type { PlanetPos } from '../types'
import { hasDignityIn } from './rulerships'

// Reception: a planet standing in another's dignity is that other's guest.
//
// Lilly admits all five essential dignities here, not domicile alone, and says
// so with a worked example in degrees: "Venus in the 24 of Aries, and Mars in
// the 16 of Gemini; here is reception by term, Mars being in the terms of
// Venus, and she in his terms." (CA p.112) Domicile is still "the strongest and
// best of all receptions" — but the weaker ones are receptions nonetheless.
//
// Because term and face belong to the degree rather than the sign, the guest's
// longitude is passed through whole.

/** Does `host` receive `guest` — is the guest sitting in the host's dignity? */
export function receives(host: PlanetPos, guest: PlanetPos): boolean {
  return hasDignityIn(host.name, guest.lon)
}

export function reception(a: PlanetPos, b: PlanetPos): 'mutual'|'oneway'|'none' {
  const aReceivedByB = receives(b, a) // a sits in a sign b has dignity in
  const bReceivedByA = receives(a, b)
  if (aReceivedByB && bReceivedByA) return 'mutual'
  if (aReceivedByB || bReceivedByA) return 'oneway'
  return 'none'
}
