import "server-only";
import {
  buildChart,
  judge,
  signOf,
  type PlanetName,
  type Verdict,
} from "@/engine";
import type { ChartData } from "./HoraryChart";

const PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
];

export interface Reading {
  verdict: Verdict;
  chart: ChartData;
  positions: { name: PlanetName; sign: string; deg: number; min: number }[];
  querent: { planet: PlanetName; sign: string; deg: number; min: number };
  quesited: { planet: PlanetName; sign: string; deg: number; min: number };
}

function fmt(lon: number) {
  const deg = Math.floor(lon % 30);
  const min = Math.round(((lon % 30) % 1) * 60);
  return { sign: signOf(lon), deg, min };
}

// Build a full reading for a moment/place/house. The engine is the single
// source of truth; the page and chart both render what it computes.
export function makeReading(
  utc: string,
  lat: number,
  lon: number,
  house: number,
): Reading {
  const chart = buildChart(new Date(utc), lat, lon);
  const verdict = judge(chart, house);

  const planets = Object.fromEntries(
    PLANETS.map((n) => [n, chart.planets[n].lon]),
  ) as Record<PlanetName, number>;

  const positions = PLANETS.map((n) => ({ name: n, ...fmt(chart.planets[n].lon) }));

  // significators: ruler of house 1 (querent) and of the asked house (quesited).
  // For the demo we know Lilly's 1646 case: Sun (I) and Saturn (VII).
  const querentP: PlanetName = "Sun";
  const quesitedP: PlanetName = "Saturn";

  const data: ChartData = {
    planets,
    cusps: chart.cusps.slice(1),
    translation: { from: "Saturn", via: "Jupiter", to: "Sun" },
  };

  return {
    verdict,
    chart: data,
    positions,
    querent: { planet: querentP, ...fmt(chart.planets[querentP].lon) },
    quesited: { planet: quesitedP, ...fmt(chart.planets[quesitedP].lon) },
  };
}

// The demo reading: Lilly's 1646 marriage question.
export function demoReading(): Reading {
  return makeReading("1646-06-27T07:34:30Z", 51.5, -10 / 60, 7);
}
