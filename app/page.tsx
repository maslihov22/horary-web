import { demoReading } from "./reading";
import { ReadingView } from "./ReadingView";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./page.module.css";

export default function Home() {
  // Computed on the server by the horary engine — no client calculation.
  const reading = demoReading();

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.brand}>
          ☉&nbsp;&nbsp;<b>HORARY</b>&nbsp;&nbsp;·&nbsp;&nbsp;traditional judgment
        </div>
        <ThemeToggle />
      </header>

      <ReadingView reading={reading} demoQuestion="Shall she marry the gentleman?" />

      <footer className={styles.footer}>
        Judged by the traditional rules · after William Lilly, Christian Astrology, 1647
      </footer>
    </main>
  );
}
