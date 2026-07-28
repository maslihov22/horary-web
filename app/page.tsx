import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LillyProof } from "./LillyProof";
import styles from "./landing.module.css";

export const metadata = {
  title: "Horary — a straight answer to one clear question",
  description:
    "Ask one question. The chart of that moment is judged by the traditional rules of William Lilly, 1647 — by a deterministic engine, not a language model's guess.",
};

// The landing page. Its job is to say what this is, why it can be trusted, and
// then get out of the way. The proof section carries the weight a testimonial
// would carry elsewhere: we have no users to quote yet, but we can show the
// engine reproducing a judgment Lilly published in 1647 — which anyone can
// check against the book.
export default function Home() {
  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.brand}>
          ☉&nbsp;&nbsp;<b>HORARY</b>&nbsp;&nbsp;·&nbsp;&nbsp;traditional judgment
        </div>
        <ThemeToggle />
      </header>

      {/* 1 — what this is, in one breath */}
      <section className={styles.hero}>
        <p className={styles.kicker}>Horary astrology · after William Lilly, 1647</p>
        <h1 className={styles.h1}>
          One question.<br />
          <em>One straight answer.</em>
        </h1>
        <div className={styles.heroSide}>
          <p className={styles.lede}>
            Not a horoscope for everyone born in April. A chart cast for the exact moment
            you ask, read against rules written down in 1647, and answered yes, no, or with
            conditions — with the reasoning shown.
          </p>
          <Link href="/ask" className={styles.cta}>
            Ask your question
          </Link>
          <p className={styles.ctaNote}>Free · no account · about a minute</p>
        </div>
      </section>

      {/* 2 — the problem, named as the reader has felt it */}
      <section className={styles.band}>
        <div className={styles.bandInner}>
          <h2 className={styles.h2}>You asked about the job. It answered about your journey.</h2>
          <div className={styles.bandProse}>
            <p className={styles.body}>
              Most astrology apps read your birth chart and produce something that fits any
              life on any day. Warm, vague, unfalsifiable. You wanted to know whether to
              take the offer, and you got a paragraph about growth.
            </p>
            <p className={styles.body}>
              Horary is the older, narrower practice, and it does the opposite. It answers
              the single question you actually asked, at the moment you cared enough to ask
              it — and it is specific enough to be wrong, which is what makes an answer
              worth having.
            </p>
          </div>
        </div>
      </section>

      {/* 3 — how it works, three steps, no mystery */}
      <section className={styles.steps}>
        <h2 className={styles.h2}>How a judgment is made</h2>
        <ol className={styles.stepList}>
          <li>
            <span className={styles.stepNo}>I</span>
            <h3 className={styles.stepH}>You ask</h3>
            <p className={styles.stepP}>
              One clear question, in your own words. The moment you send it is the moment
              the chart belongs to — that is the whole basis of the method.
            </p>
          </li>
          <li>
            <span className={styles.stepNo}>II</span>
            <h3 className={styles.stepH}>The figure is cast</h3>
            <p className={styles.stepP}>
              The heavens are computed for that second, over your own horizon, and drawn in
              the traditional square-house manner. Nothing is invented; the positions are
              astronomy.
            </p>
          </li>
          <li>
            <span className={styles.stepNo}>III</span>
            <h3 className={styles.stepH}>The chart is judged</h3>
            <p className={styles.stepP}>
              The significators are identified and weighed by Lilly&rsquo;s rules —
              perfection, prohibition, reception, the testimony of the Moon. You get the
              verdict, the reasoning behind it, and when it falls due.
            </p>
          </li>
        </ol>
      </section>

      {/* 4 — the edge, stated plainly */}
      <section className={styles.band}>
        <div className={styles.bandInner}>
          <p className={styles.kicker}>Why this is not another AI horoscope</p>
          <h2 className={styles.h2}>The answer is computed. Only the wording is written.</h2>
          <div className={styles.bandProse}>
            <p className={styles.body}>
              A language model asked to do astrology will produce something plausible every
              time, including when it is nonsense — there is nothing underneath to be right
              or wrong about.
            </p>
            <p className={styles.body}>
              Here the judgment comes from a deterministic engine implementing
              Lilly&rsquo;s rules in code: the same chart always yields the same verdict,
              and every verdict can be traced to the testimonies that produced it. The
              model is handed that finished judgment and allowed to do one thing — put it
              into readable English. It cannot change the answer, and it is forbidden to
              mention any fact the engine did not give it.
            </p>
          </div>
          <ul className={styles.facts}>
            <li>
              <b>80</b>
              <span>tests over the rules, run on every change</span>
            </li>
            <li>
              <b>1647</b>
              <span>Christian Astrology, the source text followed</span>
            </li>
            <li>
              <b>0</b>
              <span>rules invented where Lilly is silent</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 5 — proof, standing in for the testimonials we have not earned yet */}
      <LillyProof />

      {/* 6 — honest limits, then the ask */}
      <section className={styles.limits}>
        <h2 className={styles.h2}>What it can and cannot answer</h2>
        <div className={styles.limitCols}>
          <div>
            <p className={styles.limitHead}>Ask things like</p>
            <ul className={styles.good}>
              <li>Will I get the position I applied for?</li>
              <li>Will they accept my offer on the house?</li>
              <li>Is my business partner dealing honestly with me?</li>
              <li>Will the money I am owed be paid?</li>
            </ul>
          </div>
          <div>
            <p className={styles.limitHead}>These will not work</p>
            <ul className={styles.bad}>
              <li>Will I be happy?</li>
              <li>What should I do with my life?</li>
              <li>Everything about my future, please</li>
              <li>Anything you do not genuinely want answered</li>
            </ul>
          </div>
        </div>
        <p className={styles.limitNote}>
          A horary answers a real question asked in earnest. Idle or unfocused questions
          produce a chart the tradition itself calls unfit to judge — and when that happens,
          we say so rather than making something up.
        </p>
      </section>

      <section className={styles.closer}>
        <h2 className={styles.closerH}>What do you actually want to know?</h2>
        <Link href="/ask" className={styles.cta}>
          Ask your question
        </Link>
      </section>

      <footer className={styles.footer}>
        Judged by the traditional rules · after William Lilly, <i>Christian Astrology</i>, 1647
      </footer>
    </main>
  );
}
