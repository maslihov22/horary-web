import "server-only";
import { chat, parseJsonLoose, LlmError } from "./client";
import { CLASSIFIER_SYSTEM, HOUSE_TOPICS } from "./prompts";

export interface Classification {
  house: number;
  /** Short noun phrase shown back to the querent for confirmation. */
  topic: string;
  confidence: number;
  /** Lilly's own label for the house, used in the narrator's input. */
  label: string;
}

const MAX_QUESTION_CHARS = 300;

/**
 * Routes a free-text question to one house.
 *
 * The querent always confirms the result before anything is computed, so this
 * is a suggestion, not a decision — but a wrong suggestion that reads plausibly
 * gets waved through, so the model is kept cold (temperature 0) and its output
 * is validated rather than trusted.
 */
export async function classify(question: string): Promise<Classification> {
  const q = question.trim();
  if (!q) throw new LlmError("The question is empty");
  if (q.length > MAX_QUESTION_CHARS) {
    throw new LlmError(`The question is too long (max ${MAX_QUESTION_CHARS} characters)`);
  }

  // v4-flash sometimes reasons before answering and sometimes does not — the
  // same prompt at temperature 0 goes either way. Reasoning costs ~180 tokens,
  // and starving it does not just truncate the JSON: the non-reasoning path
  // classifies visibly worse ("will she come back" -> 11 hopes, not 7 partner).
  // So the budget is generous, and a truncated reply is retried, not failed.
  let raw = "";
  let parsed: unknown;
  let lastErr = "";

  for (const maxTokens of [600, 900]) {
    try {
      raw = await chat({
        system: CLASSIFIER_SYSTEM,
        user: q,
        temperature: 0,
        maxTokens,
        json: true,
      });
      parsed = parseJsonLoose(raw);
      break;
    } catch (err) {
      // Truncation and unparseable JSON are the same failure here, and both
      // are worth one more attempt with more room.
      lastErr = err instanceof LlmError ? err.message : raw.slice(0, 120);
    }
  }

  if (parsed === undefined) {
    throw new LlmError(`Classifier did not return JSON: ${lastErr}`);
  }

  const o = parsed as Record<string, unknown>;
  const house = Number(o.house);
  if (!Number.isInteger(house) || house < 1 || house > 12) {
    throw new LlmError(`Classifier returned an invalid house: ${String(o.house)}`);
  }

  const topic = typeof o.topic === "string" ? o.topic.trim().slice(0, 60) : "";
  const confidence = Number(o.confidence);

  return {
    house,
    topic: topic || HOUSE_TOPICS[house - 1].label,
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.5,
    label: HOUSE_TOPICS[house - 1].label,
  };
}

/** Maps a querent-supplied topic back to a house when they reject the guess. */
export function houseFromLabel(house: number): string {
  return HOUSE_TOPICS[house - 1]?.label ?? "the matter";
}
