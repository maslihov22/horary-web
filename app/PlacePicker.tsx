"use client";

import { useEffect, useRef, useState } from "react";
import type { Place } from "./ReadingView";
import styles from "./page.module.css";

interface Hit {
  label: string;
  lat: number;
  lon: number;
}

/**
 * Shows where the chart is being cast, and lets the querent correct it.
 *
 * The location comes from the edge's IP guess, which a VPN or a mobile carrier
 * can place in the wrong country — and the country is what actually moves the
 * significators. So it is always stated in the open, never assumed silently.
 */
export function PlacePicker({
  place,
  onChange,
}: {
  place: Place;
  onChange: (p: Place) => void;
}) {
  const [editing, setEditing] = useState(!place.known);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    // Debounced, and stale responses are discarded by sequence number so a slow
    // early request cannot overwrite a fast later one.
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (seq.current === mine) setHits(data.results ?? []);
      } catch {
        if (seq.current === mine) setHits([]);
      } finally {
        if (seq.current === mine) setSearching(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  // Results belong to the query that fetched them; once the field is cleared
  // past the threshold there is nothing to show.
  const shown = query.trim().length < 2 ? [] : hits;

  if (!editing) {
    return (
      <p className={styles.placeLine}>
        Cast for <span className={styles.placeName}>{place.label}</span>
        <button className={styles.placeEdit} onClick={() => setEditing(true)}>
          not here?
        </button>
      </p>
    );
  }

  return (
    <div className={styles.placeEditor}>
      <label className={styles.placeLabel} htmlFor="place-q">
        {place.known ? "Where are you?" : "We could not tell where you are — which city?"}
      </label>
      <input
        id="place-q"
        className={styles.placeInput}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Chișinău"
        autoComplete="off"
        autoFocus
      />
      {searching && <p className={styles.placeHint}>searching…</p>}
      {shown.length > 0 && (
        <ul className={styles.placeHits}>
          {shown.map((h) => (
            <li key={`${h.lat},${h.lon}`}>
              <button
                className={styles.placeHit}
                onClick={() => {
                  onChange({ lat: h.lat, lon: h.lon, label: h.label, known: true });
                  setEditing(false);
                  setQuery("");
                  setHits([]);
                }}
              >
                {h.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {place.known && (
        <button className={styles.placeCancel} onClick={() => setEditing(false)}>
          keep {place.label}
        </button>
      )}
    </div>
  );
}
