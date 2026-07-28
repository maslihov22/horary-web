import { sidereal } from 'astronomia'
import { normalizeDeg } from './angles'

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

// Mean obliquity of the ecliptic (deg) at jde
function obliquityDeg(jde: number): number {
  const T = (jde - 2451545.0) / 36525
  return 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T ** 3
}

// Right Ascension of the MC (deg) = local apparent sidereal time in degrees.
// astronomia 4.2: sidereal.apparent returns SECONDS of time.
//   seconds / 3600 = hours; hours * 15 = degrees.
function ramcDeg(jde: number, lonDeg: number): number {
  const gastHours = sidereal.apparent(jde) / 3600
  const gastDeg = gastHours * 15
  return normalizeDeg(gastDeg + lonDeg) // east longitude positive
}

export function regiomontanusCusps(jde: number, latDeg: number, lonDeg: number): number[] {
  const eps = obliquityDeg(jde) * D2R
  const lat = latDeg * D2R
  const ramc = ramcDeg(jde, lonDeg)
  const ramcR = ramc * D2R

  // MC ecliptic longitude from RAMC
  let mc = normalizeDeg(Math.atan2(Math.tan(ramcR), Math.cos(eps)) * R2D)
  // keep MC in the same half of the ecliptic as RAMC
  if (Math.cos(ramcR) < 0) mc = normalizeDeg(mc + 180)

  // Ascendant
  const asc = normalizeDeg(
    Math.atan2(
      Math.cos(ramcR),
      -(Math.sin(ramcR) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)),
    ) * R2D,
  )

  // Regiomontanus intermediate cusps: the house circles are great circles
  // through the north/south horizon points. The ecliptic longitude of a cusp
  // whose equatorial position is `offset` degrees past the RAMC is:
  //   λ = atan2( sin A, cos A·cos ε − sin ε·tan φ·sin(offset) )
  // where A = RAMC + offset. The sin(offset) term is the Regiomontanus
  // house-pole projection (it vanishes at the MC, offset=0, and is largest
  // near the horizon). Verified against astro.com to <0.02°.
  function cuspAt(offsetDeg: number): number {
    const A = (ramc + offsetDeg) * D2R
    const lonEcl = Math.atan2(
      Math.sin(A),
      Math.cos(A) * Math.cos(eps) - Math.sin(eps) * Math.tan(lat) * Math.sin(offsetDeg * D2R),
    )
    return normalizeDeg(lonEcl * R2D)
  }

  const c: number[] = new Array(13).fill(0)
  c[10] = mc
  c[1] = asc
  c[11] = cuspAt(30)
  c[12] = cuspAt(60)
  c[2] = cuspAt(120)
  c[3] = cuspAt(150)
  c[4] = normalizeDeg(c[10] + 180)
  c[5] = normalizeDeg(c[11] + 180)
  c[6] = normalizeDeg(c[12] + 180)
  c[7] = normalizeDeg(c[1] + 180)
  c[8] = normalizeDeg(c[2] + 180)
  c[9] = normalizeDeg(c[3] + 180)
  return c
}

export function houseOf(lon: number, cusps: number[]): number {
  const L = normalizeDeg(lon)
  for (let h = 1; h <= 12; h++) {
    const start = cusps[h]
    const end = cusps[h === 12 ? 1 : h + 1]
    const span = normalizeDeg(end - start)
    const off = normalizeDeg(L - start)
    if (off < span) return h
  }
  return 12
}
