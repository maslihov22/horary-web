"use client";

import { useState } from "react";
import { HOUSE_LABELS } from "./houses";
import styles from "./page.module.css";

interface Confirm {
  house: number;
  topic: string;
  confidence: number;
  label: string;
}

/**
 * The querent settles what the question is about before anything is computed.
 *
 * A horary judged on the wrong house answers a question nobody asked, and does
 * it with full confidence — so the guess is always shown, never applied
 * silently. When the guess is weak we say so rather than presenting it flatly.
 */
export function TopicConfirm({
  confirm,
  onConfirm,
  onChoose,
  onCancel,
}: {
  confirm: Confirm;
  onConfirm: () => void;
  onChoose: (house: number) => void;
  onCancel: () => void;
}) {
  const [picking, setPicking] = useState(confirm.confidence < 0.4);

  return (
    <div className={styles.confirm}>
      {!picking ? (
        <>
          <p className={styles.confirmQ}>
            Your question is about <em>{confirm.topic}</em>?
          </p>
          <p className={styles.confirmHint}>
            {confirm.confidence < 0.7
              ? "I am not certain — correct me if this is not your matter."
              : `Judged on the ${ordinal(confirm.house)} house · ${confirm.label}`}
          </p>
          <div className={styles.confirmRow}>
            <button className={styles.yes} onClick={onConfirm}>
              Yes, that&rsquo;s it
            </button>
            <button className={styles.notIt} onClick={() => setPicking(true)}>
              No — it&rsquo;s about something else
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.confirmQ}>What is your question really about?</p>
          <div className={styles.topicGrid}>
            {HOUSE_LABELS.map((h) => (
              <button
                key={h.house}
                className={styles.topicChip}
                onClick={() => onChoose(h.house)}
                title={h.covers}
              >
                {h.label}
              </button>
            ))}
          </div>
          <button className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
