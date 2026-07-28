"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Reading } from "./reading";
import type { PlanetName } from "@/engine";
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

const VERDICT_WORD: Record<Reading["verdict"]["verdict"], string> = {
  yes: "Yes.",
  no: "No.",
  qualified: "With conditions.",
};

export function ReadingView({ reading, demoQuestion }: { reading: Reading; demoQuestion: string }) {
  const [question, setQuestion] = useState(demoQuestion);
  const [cast, setCast] = useState(true); // demo starts revealed

  const v = reading.verdict;

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

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            setCast(true);
          }}
        >
          <input
            className={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will I get the position I applied for?"
            aria-label="Your question"
          />
          <button type="submit" className={styles.cast}>
            Cast the chart
          </button>
        </form>
        <p className={styles.demoNote}>
          Shown below: the reading Lilly himself judged in 1646 — a worked example, computed by the
          same engine.
        </p>
      </section>

      {cast && (
        <section className={styles.layout}>
          <figure className={styles.figure}>
            <div className={styles.chartHead}>
              <span className={styles.q}>{question}</span>
              <span className={styles.meta}>
                27 Jun 1646 · 07:33 LMT
                <br />
                London · Regiomontanus
              </span>
            </div>
            <HoraryChart data={reading.chart} />
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
                  {GLYPH[reading.querent.planet]} {reading.querent.planet}
                </div>
                <div className={styles.pos}>
                  {reading.querent.deg}°{reading.querent.min.toString().padStart(2, "0")}′{" "}
                  {SIGN_GLYPH[reading.querent.sign]} {reading.querent.sign}
                </div>
              </div>
              <div className={styles.sig}>
                <div className={styles.role}>Quesited · VII</div>
                <div className={styles.who}>
                  {GLYPH[reading.quesited.planet]} {reading.quesited.planet}
                </div>
                <div className={styles.pos}>
                  {reading.quesited.deg}°{reading.quesited.min.toString().padStart(2, "0")}′{" "}
                  {SIGN_GLYPH[reading.quesited.sign]} {reading.quesited.sign}
                </div>
              </div>
            </div>

            <ul className={styles.reasons}>
              {v.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            {v.timing && <div className={styles.timing}>Perfects {v.timing}</div>}
          </aside>
        </section>
      )}
    </>
  );
}
