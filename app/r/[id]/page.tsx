import Link from "next/link";
import { notFound } from "next/navigation";
import { getReading } from "@/app/readings-store";
import { ThemeToggle } from "@/app/ThemeToggle";
import { SavedReading } from "./SavedReading";
import styles from "@/app/page.module.css";
import guard from "./guard.module.css";

// A reading is private. The link addresses it; the cookie set when it was cast
// is what opens it. Search engines must not index these at all.
export const metadata = {
  title: "Your reading · Horary",
  robots: { index: false, follow: false },
};

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await getReading(id);

  if (access.status === "not-found") notFound();

  if (access.status === "forbidden") {
    return (
      <main className={styles.wrap}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            ☉&nbsp;&nbsp;<b>HORARY</b>&nbsp;&nbsp;·&nbsp;&nbsp;traditional judgment
          </Link>
          <ThemeToggle />
        </header>

        <section className={guard.wrap}>
          <p className={guard.kicker}>Private</p>
          <h1 className={guard.h1}>This reading belongs to someone else.</h1>
          <p className={guard.body}>
            It exists, but it opens only in the browser it was asked from. A horary is a
            question someone put in earnest — often about health, money, or another person —
            so the link alone is deliberately not enough to read it.
          </p>
          <p className={guard.body}>
            If it is yours, open it on the device where you asked. Recovering a reading by
            email is coming; for now the browser that cast it is the only key.
          </p>
          <Link href="/ask" className={guard.cta}>
            Ask your own question
          </Link>
        </section>

        <footer className={styles.footer}>
          Judged by the traditional rules · after William Lilly, Christian Astrology, 1647
        </footer>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          ☉&nbsp;&nbsp;<b>HORARY</b>&nbsp;&nbsp;·&nbsp;&nbsp;traditional judgment
        </Link>
        <ThemeToggle />
      </header>

      <SavedReading reading={access.reading} />

      <footer className={styles.footer}>
        Judged by the traditional rules · after William Lilly, Christian Astrology, 1647
      </footer>
    </main>
  );
}
