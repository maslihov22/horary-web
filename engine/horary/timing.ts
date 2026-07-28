import type { SignName } from '../types'

const MODALITY: Record<SignName, 'cardinal'|'fixed'|'mutable'> = {
  Aries:'cardinal',Cancer:'cardinal',Libra:'cardinal',Capricorn:'cardinal',
  Taurus:'fixed',Leo:'fixed',Scorpio:'fixed',Aquarius:'fixed',
  Gemini:'mutable',Virgo:'mutable',Sagittarius:'mutable',Pisces:'mutable',
}
const UNIT: Record<'cardinal'|'fixed'|'mutable', string> = {
  cardinal: 'days', mutable: 'weeks', fixed: 'months',
}

// Lilly's unit-by-modality timing: the degrees to perfection become a count,
// the sign's modality sets the unit (cardinal=days, mutable=weeks, fixed=months).
export function estimateTiming(degreesToPerfect: number, sign: SignName): string {
  const n = Math.max(1, Math.round(degreesToPerfect))
  return `~${n} ${UNIT[MODALITY[sign]]}`
}
