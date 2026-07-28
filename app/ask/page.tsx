import Link from "next/link";
import { ReadingView } from "../ReadingView";
import { ThemeToggle } from "../ThemeToggle";
import styles from "../page.module.css";

export const metadata = {
  title: "Ask a question · Horary",
  description:
    "Ask one clear question and have the chart of this moment judged by the traditional rules.",
};

// The tool proper. Nothing is computed until the querent asks — no demo chart,
// no borrowed verdict. What they see first is an empty field and their own
// question going into it.
export default function Ask() {
  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          ☉&nbsp;&nbsp;<b>HORARY</b>&nbsp;&nbsp;·&nbsp;&nbsp;traditional judgment
        </Link>
        <ThemeToggle />
      </header>

      <ReadingView />

      <footer className={styles.footer}>
        Judged by the traditional rules · after William Lilly, Christian Astrology, 1647
      </footer>
    </main>
  );
}
