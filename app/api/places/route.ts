import { NextResponse } from "next/server";

// City lookup for when the querent corrects the guessed location — a VPN puts
// them in the wrong country, or they are simply travelling.
//
// Open-Meteo's geocoder: no key, no attribution requirement, generous limits.
// Only what the chart needs comes back; we do not forward the querent's own
// address or IP anywhere.

const GEOCODER = "https://geocoding-api.open-meteo.com/v1/search";

export interface PlaceHit {
  label: string;
  lat: number;
  lon: number;
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const url = `${GEOCODER}?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    const results: PlaceHit[] = (data?.results ?? [])
      .filter((r: { latitude?: number; longitude?: number }) =>
        Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
      .map((r: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({
        label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
        lat: r.latitude,
        lon: r.longitude,
      }));

    return NextResponse.json({ results });
  } catch {
    // A geocoder outage must not block a reading — the querent keeps the
    // location we already have.
    return NextResponse.json({ results: [] });
  }
}
