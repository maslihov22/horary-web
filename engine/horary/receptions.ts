import type { PlanetPos } from '../types'
import { signOf, hasDignityIn } from './rulerships'

// Reception: a planet standing in another's dignity is that other's guest.
//
// Lilly does not limit this to domicile — collection of light requires that the
// significators "both receive him in some of their essential dignities" — so
// domicile, exaltation and triplicity all count. Domicile remains the strongest
// and is what the older domicile-only reading captured.

/** Does `host` receive `guest` — is the guest sitting in the host's dignity? */
export function receives(host: PlanetPos, guest: PlanetPos): boolean {
  return hasDignityIn(host.name, signOf(guest.lon))
}

export function reception(a: PlanetPos, b: PlanetPos): 'mutual'|'oneway'|'none' {
  const aReceivedByB = receives(b, a) // a sits in a sign b has dignity in
  const bReceivedByA = receives(a, b)
  if (aReceivedByB && bReceivedByA) return 'mutual'
  if (aReceivedByB || bReceivedByA) return 'oneway'
  return 'none'
}
