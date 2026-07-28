import type { Chart } from '../types'
import { toJDE } from './julian'
import { geocentricPlanets } from './planets'
import { regiomontanusCusps } from './houses'

export function buildChart(utc: Date, latDeg: number, lonDeg: number): Chart {
  const jde = toJDE(utc)
  return {
    jde,
    planets: geocentricPlanets(jde),
    cusps: regiomontanusCusps(jde, latDeg, lonDeg),
  }
}
