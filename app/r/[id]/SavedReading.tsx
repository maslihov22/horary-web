"use client";

import dynamic from "next/dynamic";
import type { StoredReading } from "@/app/readings-store";
import type { PlanetName } from "@/engine";
import styles from "@/app/page.module.css";

const HoraryChart = dynamic(
  () => import("@/app/HoraryChart").then((m) => m.HoraryChart),
  { ssr: false, loading: () => <div className={styles.chartLoading}>Drawing the figure…</div> },
);

const GLYPH: Record<PlanetName, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄",
};
const SIGN_GLYPH: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const VERDICT_WORD = { yes: "Yes.", no: "No.", qualified: "With conditions." } as const;

function formatMoment(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

// A reading being revisited. It was drawn once already, when it was cast, so
// the hand-drawing animation would be a lie the second time — the figure is
// simply here.
export function SavedReading({ reading }: { reading: StoredReading }) {
  const v = reading.verdict;

  return (
    <section className={`${styles.layout} ${styles.layoutJudged}`}>
      <figure className={styles.figure}>
        <div className={styles.chartHead}>
          <span className={styles.q}>{reading.question}</span>
          <span className={styles.meta}>
            {formatMoment(reading.moment)}
            <br />
            {reading.place.label} · Regiomontanus
          </span>
        </div>
        <HoraryChart data={reading.chart} animate={false} />
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
              {reading.querent.deg}°{String(reading.querent.min).padStart(2, "0")}′{" "}
              {SIGN_GLYPH[reading.querent.sign]} {reading.querent.sign}
            </div>
          </div>
          <div className={styles.sig}>
            <div className={styles.role}>Quesited · {ROMAN[reading.house]}</div>
            <div className={styles.who}>
              {GLYPH[reading.quesited.planet]} {reading.quesited.planet}
            </div>
            <div className={styles.pos}>
              {reading.quesited.deg}°{String(reading.quesited.min).padStart(2, "0")}′{" "}
              {SIGN_GLYPH[reading.quesited.sign]} {reading.quesited.sign}
            </div>
          </div>
        </div>

        <div className={styles.narration}>{reading.narration}</div>

        <div className={styles.workingHead}>The testimonies</div>
        <ul className={styles.reasons}>
          {v.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        {v.timing && <div className={styles.timing}>Perfects {v.timing}</div>}
      </aside>
    </section>
  );
}
