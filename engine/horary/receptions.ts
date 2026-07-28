import type { PlanetPos } from '../types'
import { signOf, rulerOfSign } from './rulerships'

// Domicile reception only (first version). Mutual when each planet occupies a
// sign ruled by the other; one-way when only one does.
export function reception(a: PlanetPos, b: PlanetPos): 'mutual'|'oneway'|'none' {
  const aInB = rulerOfSign(signOf(a.lon)) === b.name // a sits in b's sign
  const bInA = rulerOfSign(signOf(b.lon)) === a.name // b sits in a's sign
  if (aInB && bInA) return 'mutual'
  if (aInB || bInA) return 'oneway'
  return 'none'
}
