import { buildChart } from './astro/chart'
import { judge } from './horary/engine'
import type { Verdict } from './types'

export interface ReadingInput {
  utc: string   // ISO instant the question was asked
  lat: number   // observer latitude, degrees north positive
  lon: number   // observer longitude, degrees east positive
  house: number // house of the quesited (e.g. 7 = partner, 10 = career)
}

// End-to-end: a question's moment/place/house → a traditional horary verdict.
export function runReading(input: ReadingInput): Verdict {
  const chart = buildChart(new Date(input.utc), input.lat, input.lon)
  return judge(chart, input.house)
}

// CLI: tsx src/cli.ts '{"utc":"...","lat":..,"lon":..,"house":10}'
if (process.argv[1] && /cli\.(ts|js)$/.test(process.argv[1])) {
  const raw = process.argv[2]
  if (!raw) {
    console.error('usage: cli.js \'{"utc":"2020-06-01T14:30:00Z","lat":40.71,"lon":-74.0,"house":10}\'')
    process.exit(1)
  }
  const out = runReading(JSON.parse(raw))
  console.log(JSON.stringify(out, null, 2))
}
