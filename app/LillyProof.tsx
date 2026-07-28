import { demoReading } from "./reading";
import styles from "./landing.module.css";

// The proof section. Every other landing page puts testimonials here; we have
// no users to quote, and inventing them would be exactly the kind of thing this
// product exists to be the opposite of.
//
// What we have instead is checkable: in 1647 Lilly published a chart, his
// reasoning and his verdict. The engine is given the same moment, knows nothing
// of his answer, and arrives at the same one. The reader can verify it against
// the book — which no testimonial allows.
//
// Computed here on the server by the real engine, not transcribed. If the
// engine ever stopped reproducing Lilly, this section would say so.
export function LillyProof() {
  const reading = demoReading();
  const v = reading.verdict;
  const agrees = v.verdict === "yes";

  return (
    <section className={styles.proof}>
      <p className={styles.kicker}>Check us against the book</p>
      <h2 className={styles.h2}>
        A question judged in 1646, and judged again just now.
      </h2>
      <p className={styles.body}>
        In <i>Christian Astrology</i> Lilly sets out the case of a lady asking whether she
        would marry the gentleman she had in mind. He gives the moment, his working, and his
        answer. Below, our engine is handed that same moment — and nothing else.
      </p>

      <div className={styles.proofGrid}>
        <div className={styles.proofCol}>
          <p className={styles.proofWho}>William Lilly, 1647</p>
          <p className={styles.proofVerdict}>Yes.</p>
          <p className={styles.proofSaid}>
            He judges that the marriage will be brought about — not directly, but through a
            third party carrying the matter between them.
          </p>
          <p className={styles.proofCite}>Christian Astrology, pp. 385–390</p>
        </div>

        <div className={styles.proofCol}>
          <p className={styles.proofWho}>This engine, computed on load</p>
          <p className={styles.proofVerdict}>
            {v.verdict === "yes" ? "Yes." : v.verdict === "no" ? "No." : "With conditions."}
          </p>
          <ul className={styles.proofReasons}>
            {v.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {v.timing && <p className={styles.proofTiming}>Perfects {v.timing}</p>}
        </div>
      </div>

      <p className={agrees ? styles.proofSeal : styles.proofSealBroken}>
        {agrees
          ? "Same verdict, same mechanism — three and a half centuries apart."
          : "The engine no longer reproduces Lilly's judgment. That is a bug, and it is being shown rather than hidden."}
      </p>
    </section>
  );
}
