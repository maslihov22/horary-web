"use client";

import { useEffect, useRef, useState } from "react";
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

const VERDICT_WORD: Record<Reading["verdict"]["verdict"], string> = {
  yes: "Yes.",
  no: "No.",
  qualified: "With conditions.",
};

/** A beat between the figure finishing and the judgment arriving. */
const SETTLE = 400;

/** If the chart never reports back, the judgment must not be lost with it. */
const DRAW_CEILING = 12000;

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

interface CastReading extends Reading {
  /** Null when the judgment stood but storing it did not. */
  id: string | null;
  claimUrl: string | null;
  question: string;
  house: number;
  narration: string;
  fallback: boolean;
  place: Place;
  moment: string;
}

type Stage =
  | { kind: "idle" }
  | { kind: "classifying" }
  | { kind: "confirm"; confirm: Confirm }
  | { kind: "casting" }
  | { kind: "drawn" }   // chart is up and drawing, judgment still withheld
  | { kind: "judged" }  // chart has slid aside, judgment is in
  | { kind: "error"; message: string };

/** The moment of the question, in the querent's own local time. */
function formatMoment(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

export function ReadingView() {
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [cast, setCast] = useState<CastReading | null>(null);
  // The moment the question was asked — stamped on submit, not when the topic
  // is confirmed, so the seconds spent classifying cannot move the ascendant.
  const askedAt = useRef<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const figureRef = useRef<HTMLDivElement>(null);

  const busy = stage.kind === "classifying" || stage.kind === "casting";
  const hasFigure = stage.kind === "drawn" || stage.kind === "judged";
  const judged = stage.kind === "judged";

  // The judgment waits for the figure to finish drawing — the chart reports
  // when that is, since its length depends on how many elements it emitted.
  // The ceiling is only a guard against a draw that never reports.
  useEffect(() => {
    if (stage.kind !== "drawn") return;
    const t = setTimeout(() => setStage({ kind: "judged" }), DRAW_CEILING);
    return () => clearTimeout(t);
  }, [stage.kind]);

  function figureDrawn() {
    setTimeout(() => {
      setStage((s) => (s.kind === "drawn" ? { kind: "judged" } : s));
    }, SETTLE);
  }

  // On a narrow screen the judgment appears below the fold rather than beside
  // the chart, so carry the querent to it.
  useEffect(() => {
    if (stage.kind !== "judged") return;
    if (window.matchMedia("(min-width: 981px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      document.getElementById("judgment")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 260);
    return () => clearTimeout(t);
  }, [stage.kind]);

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
      setStage({ kind: "drawn" });
      // Bring the figure into view; it is drawn below the asking field.
      requestAnimationFrame(() => {
        figureRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } catch (err) {
      setStage({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  function askAnother() {
    setCast(null);
    setQuestion("");
    setStage({ kind: "idle" });
    askedAt.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const v = cast?.verdict;

  return (
    <>
      <section className={`${styles.ask} ${hasFigure ? styles.askDone : ""}`}>
        {!hasFigure && (
          <>
            <div className={styles.kicker}>Ask one clear question</div>
            <h1 className={styles.h1}>
              The chart answers <em>the question asked.</em>
            </h1>
            <p className={styles.sub}>
              A horary is cast for the moment a question is truly asked, and judged by the
              traditional rules set down by William Lilly in 1647.
            </p>
          </>
        )}

        <form className={styles.form} onSubmit={ask}>
          <input
            className={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will I get the position I applied for?"
            aria-label="Your question"
            maxLength={300}
            disabled={busy || hasFigure}
          />
          {!hasFigure && (
            <button type="submit" className={styles.cast} disabled={busy || !question.trim()}>
              {stage.kind === "classifying" ? "Reading it…" : "Cast the chart"}
            </button>
          )}
          {hasFigure && (
            <button type="button" className={styles.notIt} onClick={askAnother}>
              Ask another
            </button>
          )}
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
      </section>

      {cast && v && (
        <section className={`${styles.layout} ${judged ? styles.layoutJudged : ""}`}>
          <figure className={styles.figure} ref={figureRef}>
            <div className={styles.chartHead}>
              <span className={styles.q}>{cast.question}</span>
              <span className={styles.meta}>
                {formatMoment(cast.moment)}
                <br />
                {cast.place.label} · Regiomontanus
              </span>
            </div>
            <HoraryChart data={cast.chart} onDrawn={figureDrawn} />
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

          <aside
            id="judgment"
            className={styles.panel}
            aria-live="polite"
            aria-busy={!judged}
          >
            {!judged ? (
              <p className={styles.weighing}>Weighing the testimonies</p>
            ) : (
              <>
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
                      {GLYPH[cast.querent.planet]} {cast.querent.planet}
                    </div>
                    <div className={styles.pos}>
                      {cast.querent.deg}°{cast.querent.min.toString().padStart(2, "0")}′{" "}
                      {SIGN_GLYPH[cast.querent.sign]} {cast.querent.sign}
                    </div>
                  </div>
                  <div className={styles.sig}>
                    <div className={styles.role}>Quesited · {ROMAN[cast.house]}</div>
                    <div className={styles.who}>
                      {GLYPH[cast.quesited.planet]} {cast.quesited.planet}
                    </div>
                    <div className={styles.pos}>
                      {cast.quesited.deg}°{cast.quesited.min.toString().padStart(2, "0")}′{" "}
                      {SIGN_GLYPH[cast.quesited.sign]} {cast.quesited.sign}
                    </div>
                  </div>
                </div>

                <div className={styles.narration}>{cast.narration}</div>

                <div className={styles.workingHead}>The testimonies</div>
                <ul className={styles.reasons}>
                  {v.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>

                {v.timing && <div className={styles.timing}>Perfects {v.timing}</div>}

                {/* The reading opens only in this browser. Telegram is how it
                    travels: pressing Start hands the bot this reading's id
                    along with a chat id Telegram vouches for, so nothing needs
                    to be typed and nothing can be claimed by guessing. */}
                {cast.claimUrl ? (
                  <div className={styles.keepBlock}>
                    <a
                      className={styles.keepBtn}
                      href={cast.claimUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Keep in Telegram
                    </a>
                    <p className={styles.keepNote}>
                      One tap — nothing to type. Otherwise this reading opens only in this
                      browser.{" "}
                      <a className={styles.keepLink} href={`/r/${cast.id}`}>
                        Its address
                      </a>
                    </p>
                  </div>
                ) : cast.id ? (
                  <p className={styles.keepLine}>
                    Saved —{" "}
                    <a className={styles.keepLink} href={`/r/${cast.id}`}>
                      return to this reading
                    </a>
                    <span className={styles.keepNote}>opens in this browser only</span>
                  </p>
                ) : (
                  // Judged but not stored. Saying so is what tells the querent
                  // to copy it now rather than trust a link that was never made.
                  <p className={styles.keepLine}>
                    Not saved
                    <span className={styles.keepNote}>
                      this judgment could not be stored — copy it before leaving
                    </span>
                  </p>
                )}
              </>
            )}
          </aside>
        </section>
      )}
    </>
  );
}
