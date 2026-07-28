"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import styles from "./page.module.css";

// Server and first client render agree on `false`; the store reports `true`
// only once hydrated. This is what useSyncExternalStore is for — no effect, no
// cascading render, no mismatch warning.
const subscribe = () => () => {};
const isHydrated = () => true;
const isServer = () => false;

// Sun and Moon, the two luminaries — the same pair the chart is judged by, so
// the control reads as part of the figure rather than a widget bolted on.
//
// Before hydration the resolved theme is unknown; rendering either state would
// flash the wrong one, so the track shows with no thumb until mounted.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, isHydrated, isServer);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      role="switch"
      aria-checked={mounted ? isDark : undefined}
      aria-label="Night mode"
      title={mounted ? (isDark ? "Day" : "Night") : undefined}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      data-mounted={mounted ? "" : undefined}
      data-dark={mounted && isDark ? "" : undefined}
    >
      <span className={styles.toggleGlyph} aria-hidden="true">☉</span>
      <span className={styles.toggleGlyph} aria-hidden="true">☾</span>
      <span className={styles.toggleThumb} aria-hidden="true" />
    </button>
  );
}
