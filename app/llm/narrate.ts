import "server-only";
import { chat, LlmError } from "./client";
import { NARRATOR_SYSTEM, narratorInput } from "./prompts";

export interface NarrateInput {
  question: string;
  topicLabel: string;
  verdict: "yes" | "no" | "qualified";
  confidence: number;
  reasons: string[];
  timing: string | null;
  querent: { planet: string; sign: string; deg: number; min: number };
  quesited: { planet: string; sign: string; deg: number; min: number };
}

export interface Narration {
  text: string;
  /** True when the model failed validation and we fell back to raw testimonies. */
  fallback: boolean;
}

/**
 * Does the prose actually carry the engine's verdict?
 *
 * The engine's answer is the product; prose that contradicts it is worse than
 * no prose at all. This is a coarse check — it looks at the opening, where the
 * system prompt requires the verdict to be stated — but it catches the failure
 * that matters: the model talking itself into the opposite answer.
 */
function contradictsVerdict(text: string, verdict: string): boolean {
  const opening = text.slice(0, 220).toLowerCase();

  const saysYes = /\byes\b|\bit will\b|\bshall come to pass\b|\bwill be brought\b/.test(opening);
  const saysNo = /\bno\b|\bwill not\b|\bshall not\b|\bnot come to pass\b|\bdenied\b/.test(opening);

  if (verdict === "yes") return saysNo && !saysYes;
  if (verdict === "no") return saysYes && !saysNo;
  return false; // "qualified" is legitimately expressed either way
}

/** Last resort: the engine's own testimonies, unadorned. Always truthful. */
function fallbackText(input: NarrateInput): string {
  const head =
    input.verdict === "yes" ? "Yes." :
    input.verdict === "no" ? "No." :
    "The chart answers with a condition.";
  const timing = input.timing ? ` Timing: ${input.timing}.` : "";
  return `${head}\n\n${input.reasons.join(" ")}${timing}`;
}

/**
 * Turns the engine's judgment into prose.
 *
 * The model never decides anything: the verdict, the testimonies and the timing
 * all arrive fixed, and it writes around them. If it strays, we retry at a
 * colder temperature, then serve the engine's raw testimonies instead — a dry
 * reading beats an eloquent wrong one.
 *
 * Three attempts rather than two because the first failure is often the wire,
 * not the model: OpenRouter answers this prompt in ~5s but intermittently
 * stalls, and losing a reading to that costs a chart already computed and
 * tokens already paid for.
 */
export async function narrate(input: NarrateInput): Promise<Narration> {
  const user = narratorInput(input);
  const attempts = [0.7, 0.7, 0.2];

  for (const [i, temperature] of attempts.entries()) {
    const last = i === attempts.length - 1;
    let text: string;
    try {
      text = await chat({
        system: NARRATOR_SYSTEM,
        user,
        temperature,
        // 180 words needs ~250 tokens, but v4-flash may spend ~200 more
        // reasoning first; too tight a budget truncates the judgment mid-word.
        maxTokens: 900,
        // Generating the judgment takes ~5s when healthy, but the tail is long;
        // 30s cut off roughly a quarter of readings for no reason but impatience.
        timeoutMs: 90_000,
      });
    } catch (err) {
      if (err instanceof LlmError && last) break;
      if (err instanceof LlmError) continue;
      throw err;
    }

    // Strip markdown the prompt forbade but models emit anyway.
    text = text.replace(/^#+\s*/gm, "").replace(/\*\*/g, "").trim();

    if (!contradictsVerdict(text, input.verdict)) {
      return { text, fallback: false };
    }
  }

  return { text: fallbackText(input), fallback: true };
}
