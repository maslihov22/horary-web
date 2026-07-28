import "server-only";
import {
  buildChart,
  judge,
  signOf,
  rulerOfHouse,
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

// The gold thread on the chart marks a translation of light. The engine reports
// it in prose ("Jupiter translates the light of Saturn to Sun"), so read the
// translator back out of that line rather than assuming Lilly's case.
function translationOf(
  verdict: Verdict,
  querent: PlanetName,
  quesited: PlanetName,
): ChartData["translation"] {
  const line = verdict.reasons.find((r) => /translates the light/i.test(r));
  if (!line) return undefined;
  const via = PLANETS.find((p) => line.startsWith(p));
  if (!via) return undefined;
  return { from: quesited, via, to: querent };
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

  // Significators: ruler of house 1 (querent) and of the asked house (quesited).
  // Derived from the cusps, not assumed — for Lilly's 1646 case this yields the
  // Sun and Saturn, as it must, but it holds for any moment and any house.
  const querentP = rulerOfHouse(1, chart.cusps);
  const quesitedP = rulerOfHouse(house, chart.cusps);

  const data: ChartData = {
    planets,
    cusps: chart.cusps.slice(1),
    translation: translationOf(verdict, querentP, quesitedP),
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
