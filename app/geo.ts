import "server-only";

// Where the querent is, taken from the edge's own geolocation headers.
//
// Vercel populates these on every request at no cost; reading them directly
// rather than pulling in @vercel/functions keeps the dependency out and lets
// the same code path run locally, where the headers simply are not there.
//
// City-level accuracy is ample. Measured on this engine: moving 10 km shifts
// the ascendant by 2-5 arcminutes and changes the verdict in ~0.1% of moments
// (only when the ascendant sits on a sign boundary), whereas moving between
// countries changes the significators outright. Street precision would buy
// nothing and cost the querent their address.

export interface Place {
  lat: number;
  lon: number;
  /** Human-readable, shown under the chart so the querent can catch a VPN. */
  label: string;
  /** False when we fell back to a default and the querent should correct it. */
  known: boolean;
}

/** Greenwich: the traditional default, and honest about being a fallback. */
export const UNKNOWN_PLACE: Place = {
  lat: 51.4769,
  lon: 0,
  label: "Greenwich",
  known: false,
};

function decode(v: string | null): string {
  if (!v) return "";
  // Vercel percent-encodes non-ASCII city names (Chi%C8%99in%C4%83u).
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export function placeFromHeaders(h: Headers): Place {
  const lat = Number(h.get("x-vercel-ip-latitude"));
  const lon = Number(h.get("x-vercel-ip-longitude"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
    // The geolocation headers only exist on Vercel. Without a stand-in, every
    // local reading is silently cast for Greenwich — which is a different
    // chart, not a cosmetic default. HORARY_DEV_PLACE fills the gap:
    //   HORARY_DEV_PLACE="47.009,28.859,Chișinău"
    const dev = process.env.HORARY_DEV_PLACE;
    if (dev) {
      const [dLat, dLon, ...rest] = dev.split(",");
      const la = Number(dLat);
      const lo = Number(dLon);
      if (Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) {
        return {
          lat: la,
          lon: lo,
          label: rest.join(",").trim() || "your location",
          known: true,
        };
      }
    }
    return UNKNOWN_PLACE;
  }

  const city = decode(h.get("x-vercel-ip-city"));
  const country = decode(h.get("x-vercel-ip-country"));
  const label = [city, country].filter(Boolean).join(", ") || "your location";

  return { lat, lon, label, known: true };
}
