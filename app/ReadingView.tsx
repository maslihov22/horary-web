"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Reading } from "./reading";
import type { PlanetName } from "@/engine";
import { TopicConfirm } from "./TopicConfirm";
import styles from "./page.module.css";

// astrochart touches the DOM/`self`; load it only in the browser.
const HoraryChart = dynamic(
  () => import("./HoraryChart").then((m) => m.HoraryChart),
  { ssr: false, loading: () => <div className={styles.chartLoading}>Casting the figure…</div> },
);

const GLYPH: Record<PlanetName, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄",
};
const SIGN_GLYPH: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** The moment of the question, in the querent's own local time. */
function formatMoment(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

const VERDICT_WORD: Record<Reading["verdict"]["verdict"], string> = {
  yes: "Yes.",
  no: "No.",
  qualified: "With conditions.",
};

/** What the API returns once a house is confirmed. */
interface CastReading extends Reading {
  question: string;
  house: number;
  narration: string;
  fallback: boolean;
  place: Place;
  moment: string;
}

export interface Place {
  lat: number;
  lon: number;
  label: string;
  known: boolean;
}

interface Confirm {
  house: number;
  topic: string;
  confidence: number;
  label: string;
  place: Place;
}

type Stage =
  | { kind: "idle" }
  | { kind: "classifying" }
  | { kind: "confirm"; confirm: Confirm }
  | { kind: "casting" }
  | { kind: "error"; message: string };

export function ReadingView({ reading, demoQuestion }: { reading: Reading; demoQuestion: string }) {
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [cast, setCast] = useState<CastReading | null>(null);
  // The moment the question was asked — stamped on submit, not when the topic
  // is confirmed, so the seconds spent classifying cannot move the ascendant.
  const askedAt = useRef<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);

  const busy = stage.kind === "classifying" || stage.kind === "casting";

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "The reading could not be cast.");
    return data;
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || busy) return;
    // The horary belongs to this instant — the one the querent chose to ask.
    askedAt.current = new Date().toISOString();
    setStage({ kind: "classifying" });
    setCast(null);
    try {
      const data = await post({ question: question.trim() });
      setPlace(data.place ?? null);
      setStage({ kind: "confirm", confirm: data });
    } catch (err) {
      setStage({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  // The querent has settled the topic — cast for the moment they asked.
  async function castFor(house: number, where: Place | null = place) {
    setStage({ kind: "casting" });
    try {
      const data = await post({
        question: question.trim(),
        house,
        utc: askedAt.current ?? new Date().toISOString(),
        ...(where ? { lat: where.lat, lon: where.lon, placeLabel: where.label } : {}),
      });
      setCast(data);
      setStage({ kind: "idle" });
    } catch (err) {
      setStage({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  // Until a real reading exists, the page shows Lilly's own 1646 judgment.
  const shown: Reading = cast ?? reading;
  const shownQuestion = cast ? cast.question : demoQuestion;
  const shownHouse = cast ? cast.house : 7;
  const v = shown.verdict;

  return (
    <>
      <section className={styles.ask}>
        <div className={styles.kicker}>Ask one clear question</div>
        <h1 className={styles.h1}>
          The chart answers <em>the question asked.</em>
        </h1>
        <p className={styles.sub}>
          A horary is cast for the moment a question is truly asked, and judged by the traditional
          rules set down by William Lilly in 1647. Phrase one thing you genuinely want to know.
        </p>

        <form className={styles.form} onSubmit={ask}>
          <input
            className={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will I get the position I applied for?"
            aria-label="Your question"
            maxLength={300}
            disabled={busy}
          />
          <button type="submit" className={styles.cast} disabled={busy || !question.trim()}>
            {stage.kind === "classifying" ? "Reading it…" : "Cast the chart"}
          </button>
        </form>

        {stage.kind === "confirm" && (
          <TopicConfirm
            confirm={stage.confirm}
            place={place}
            onPlaceChange={setPlace}
            onConfirm={() => castFor(stage.confirm.house)}
            onChoose={(house) => castFor(house)}
            onCancel={() => setStage({ kind: "idle" })}
          />
        )}

        {stage.kind === "casting" && (
          <p className={styles.castingNote}>Casting the figure for this moment…</p>
        )}

        {stage.kind === "error" && (
          <p className={styles.errorNote} role="alert">
            {stage.message}
          </p>
        )}

        {!cast && stage.kind === "idle" && (
          <p className={styles.demoNote}>
            Shown below: the reading Lilly himself judged in 1646 — a worked example, computed by the
            same engine.
          </p>
        )}
      </section>

      <section className={styles.layout}>
        <figure className={styles.figure}>
          <div className={styles.chartHead}>
            <span className={styles.q}>{shownQuestion}</span>
            <span className={styles.meta}>
              {cast ? formatMoment(cast.moment) : "27 Jun 1646 · 07:33 LMT"}
              <br />
              {cast ? cast.place.label : "London"} · Regiomontanus
            </span>
          </div>
          <HoraryChart data={shown.chart} />
          <div className={styles.legend}>
            <span>
              <i className={styles.swatch} style={{ borderColor: "var(--verdigris)" }} />
              trine · sextile
            </span>
            <span>
              <i className={styles.swatch} style={{ borderColor: "var(--vermilion)" }} />
              square · opposition
            </span>
            <span>
              <i className={styles.swatch} style={{ borderColor: "var(--gold)" }} />
              translation of light
            </span>
          </div>
        </figure>

        <aside className={styles.panel}>
          <h2 className={styles.panelH}>Judgment</h2>
          <div
            className={styles.verdictWord}
            style={{ color: v.verdict === "no" ? "var(--vermilion)" : "var(--verdigris)" }}
          >
            {VERDICT_WORD[v.verdict]}
          </div>

          <div className={styles.sigRow}>
            <div className={styles.sig}>
              <div className={styles.role}>Querent · I</div>
              <div className={styles.who}>
                {GLYPH[shown.querent.planet]} {shown.querent.planet}
              </div>
              <div className={styles.pos}>
                {shown.querent.deg}°{shown.querent.min.toString().padStart(2, "0")}′{" "}
                {SIGN_GLYPH[shown.querent.sign]} {shown.querent.sign}
              </div>
            </div>
            <div className={styles.sig}>
              <div className={styles.role}>Quesited · {ROMAN[shownHouse]}</div>
              <div className={styles.who}>
                {GLYPH[shown.quesited.planet]} {shown.quesited.planet}
              </div>
              <div className={styles.pos}>
                {shown.quesited.deg}°{shown.quesited.min.toString().padStart(2, "0")}′{" "}
                {SIGN_GLYPH[shown.quesited.sign]} {shown.quesited.sign}
              </div>
            </div>
          </div>

          {cast && <div className={styles.narration}>{cast.narration}</div>}

          {cast && <div className={styles.workingHead}>The testimonies</div>}
          <ul className={styles.reasons}>
            {v.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          {v.timing && <div className={styles.timing}>Perfects {v.timing}</div>}
        </aside>
      </section>
    </>
  );
}
