import { planetposition, solar, moonposition, elliptic, coord } from 'astronomia'
import earthData from 'astronomia/data/vsop87Bearth'
import mercuryData from 'astronomia/data/vsop87Bmercury'
import venusData from 'astronomia/data/vsop87Bvenus'
import marsData from 'astronomia/data/vsop87Bmars'
import jupiterData from 'astronomia/data/vsop87Bjupiter'
import saturnData from 'astronomia/data/vsop87Bsaturn'
import type { PlanetName, PlanetPos } from '../types'
import { normalizeDeg, radToDeg } from './angles'

const earth = new planetposition.Planet(earthData)
const vsop: Record<'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn', any> = {
  Mercury: new planetposition.Planet(mercuryData),
  Venus: new planetposition.Planet(venusData),
  Mars: new planetposition.Planet(marsData),
  Jupiter: new planetposition.Planet(jupiterData),
  Saturn: new planetposition.Planet(saturnData),
}

// Mean obliquity of the ecliptic (radians) at jde.
function obliquity(jde: number): number {
  const T = (jde - 2451545.0) / 36525
  const deg = 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T ** 3
  return (deg * Math.PI) / 180
}

// Geocentric ecliptic longitude (deg, [0,360)) of one body at jde.
// astronomia 4.2 specifics (verified):
//   - solar.apparentLongitude takes T (Julian centuries), returns ecliptic lon rad
//   - moonposition.position returns geocentric ecliptic {lon} rad
//   - elliptic.position returns geocentric EQUATORIAL {ra, dec} rad → convert to ecliptic
function lonAt(name: PlanetName, jde: number): number {
  if (name === 'Sun') {
    const T = (jde - 2451545.0) / 36525
    return normalizeDeg(radToDeg(solar.apparentLongitude(T)))
  }
  if (name === 'Moon') {
    return normalizeDeg(radToDeg(moonposition.position(jde).lon))
  }
  const { ra, dec } = elliptic.position(vsop[name as 'Mars'], earth, jde)
  const ecl = new coord.Equatorial(ra, dec).toEcliptic(obliquity(jde))
  return normalizeDeg(radToDeg(ecl.lon))
}

export function geocentricPlanets(jde: number): Record<PlanetName, PlanetPos> {
  const names: PlanetName[] =
    ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']
  const out = {} as Record<PlanetName, PlanetPos>
  for (const name of names) {
    const lon = lonAt(name, jde)
    // numeric speed: central difference over 1 day (deg/day)
    const before = lonAt(name, jde - 0.5)
    const after = lonAt(name, jde + 0.5)
    let d = after - before
    if (d > 180) d -= 360
    if (d < -180) d += 360
    out[name] = { name, lon, speed: d }
  }
  return out
}
