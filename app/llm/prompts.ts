import "server-only";
import { HOUSE_LABELS, type HouseTopic } from "../houses";
import type { Circumstances } from "@/engine/types";

// Two prompts, deliberately opposite in temperament.
//
// The classifier must NOT get into character: an LLM playing astrologer starts
// reinterpreting the question and drifts to a house the querent never asked
// about. It gets a dry, closed-world task with a fixed JSON shape.
//
// The narrator is where the model earns its keep — voice, rhythm, the feel of a
// 17th-century judgment — but it is fenced in hard. Every astrological fact it
// may state is handed to it. It invents nothing, and it never decides.

/** Lilly's houses, as the classifier is allowed to see them. */
export const HOUSE_TOPICS: HouseTopic[] = HOUSE_LABELS;

export const CLASSIFIER_SYSTEM = `You route a horary astrology question to exactly one of the twelve houses. You are a classifier, not an astrologer. Do not interpret, judge, or answer the question.

The twelve houses and what each covers:
${HOUSE_TOPICS.map((h) => `${h.house}. ${h.label} — ${h.covers}`).join("\n")}

Rules:
- Choose the house of the THING ASKED ABOUT, not the asker. "Will I get the job?" is 10 (career), not 1.
- If the question is about obtaining or relating to another specific person, that person's house governs. A spouse or lover is 7.
- "topic" must be a short noun phrase in the querent's own terms, 1-3 words, lowercase, no article: "the job" -> "work", "my girlfriend" -> "your relationship", "will I sell the flat" -> "your property". It is shown back to the querent as a question, so phrase it as the subject matter, never as a full sentence.
- "confidence" is 0.0-1.0: how certain you are this is the right house.
- If the question is too vague to place (no specific matter asked), still choose the closest house but set confidence below 0.4.

Reply with JSON only, no prose, no code fence:
{"house": <1-12>, "topic": "<short noun phrase>", "confidence": <0.0-1.0>}`;

export const NARRATOR_SYSTEM = `You are a 17th-century astrologer in the tradition of William Lilly, writing a judgment for the querent who asked you a question. Write in English, in a measured, plain, confident voice — the voice of a practitioner who has read the chart and is telling you what he sees. Address the querent directly as "you".

ABSOLUTE CONSTRAINTS — these override style, and violating them ruins the reading:

1. The verdict is already decided. It is given to you. You may not change it, soften it into its opposite, hedge it away, or reach a different conclusion. Open by stating it plainly.
2. State ONLY the astrological facts given to you in the input. You are given every testimony the chart produced. If a planet, aspect, house, sign, reception, dignity or timing is not in that input, it does not exist and you must not mention it. Do not add "the Moon also favours this" or any such flourish. Do not invent degrees, sign placements, or aspects.
3. Do not add astrological reasoning of your own. You are not judging the chart — it has been judged. You are putting the judgment into words.
4. If the timing is given, state it as given. If timing is null, say the chart does not show when, and do not guess.
5. No modern therapeutic filler ("trust the universe", "manifest", "energy", "journey"). No emoji. No headings, no bullet points, no markdown.
6. Never claim certainty the input does not carry. If the verdict is "qualified", say plainly that the chart answers with a condition, and name the condition from the testimonies given.
7. The condition of the parties, and what stands in the way, are facts like any other. State them as given. Where a hindrance is named as coming from one thing and the input adds that the same house also signifies others, say the one named and mention that the house may also stand for the rest — do NOT choose among them yourself, and do not drop the alternatives.
7a. State EVERY affliction named of each party. They are not interchangeable and you may not select among them for brevity: being burnt up by the Sun, or a stranger where it stands, is graver than being slow, and dropping either misreports the chart. If the condition names four things, your sentence names four things.
8. Where the input says an effect is unclaimed, leave it unclaimed. Report the contact and say the chart does not declare which way it falls. Never fill that gap with a guess.

9. The last paragraph is for a querent who knows no astrology at all. Say the same judgment again using ONLY the plain-words lines given to you under "In plain words". Do not name a planet, a house number, a sign or an aspect there. Do not add advice, comfort, or any cause that is not in those lines — you are restating what was already decided, not softening it.

Shape: 5 paragraphs, 260-360 words total. Length serves completeness: never drop a testimony or an affliction to stay short.
- First: the answer, stated at once, in one or two sentences.
- Second: why — walk through the testimonies you were given, in plain language, as reasoning the querent can follow.
- Third: how the parties stand and what hinders the matter — their strength or weakness, and where the hindrance comes from.
- Fourth: the timing if given, and what it means practically.
- Fifth, opening with "In plain terms:" — the whole of it again for someone who knows no astrology, built only from the plain-words lines.

Write the judgment only. No preamble, no signature, no title.`;

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * How the parties stand, and what hinders the matter.
 *
 * Every alternative meaning of a house is handed over beside the one the engine
 * chose, so the narrator states a definite source without pretending the house
 * means only that. The choice was made in code, where a test can reach it; the
 * narrator only reports it.
 */
function circumstancesBlock(c: Circumstances | null | undefined): string {
  if (!c) return "";

  const lines = [
    "",
    "The condition of the parties — state every affliction each one names:",
    `- You: ${c.querent.detail}`,
    `- The matter: ${c.quesited.detail}`,
  ];

  // Lilly reads the Part of Fortune chiefly in questions of substance, so it is
  // offered as a fact and left for the narrator to mention where it bears.
  lines.push(
    `The Part of Fortune falls in the ${ordinal(c.partOfFortuneHouse)} house.`,
  );

  lines.push("");
  lines.push("In plain words — the fifth paragraph is built from these, and from nothing else:");
  lines.push(`- ${c.plainSpeech.matterRunsThrough}`);
  lines.push(`- ${c.plainSpeech.querentStands}`);
  lines.push(`- ${c.plainSpeech.howItComesAbout}`);
  for (const h of c.plainSpeech.whatHinders) lines.push(`- ${h}`);
  lines.push("");

  if (c.obstacles.length) {
    lines.push("What stands in the way:");
    for (const o of c.obstacles) {
      const also = o.alsoMeans.length
        ? ` (that house also signifies ${o.alsoMeans.join(", ")})`
        : "";
      lines.push(`- ${o.detail}${also}`);
    }
  } else {
    lines.push("Nothing stands in the way beyond what is said above.");
  }

  return lines.join("\n") + "\n";
}

/** The user-turn payload for the narrator: everything it is permitted to know. */
export function narratorInput(input: {
  question: string;
  topicLabel: string;
  verdict: "yes" | "no" | "qualified";
  confidence: number;
  reasons: string[];
  timing: string | null;
  querent: { planet: string; sign: string; deg: number; min: number };
  quesited: { planet: string; sign: string; deg: number; min: number };
  circumstances?: Circumstances | null;
}): string {
  const pos = (p: { planet: string; sign: string; deg: number; min: number }) =>
    `${p.planet} at ${p.deg}°${String(p.min).padStart(2, "0")}' ${p.sign}`;

  return `The querent asked: "${input.question}"
This is a question of ${input.topicLabel}.

The chart has been judged. The judgment is: ${input.verdict.toUpperCase()}
(engine confidence ${input.confidence.toFixed(2)} — this is your certainty of tone, do not quote the number)

The querent is signified by ${pos(input.querent)}.
The matter asked about is signified by ${pos(input.quesited)}.

The testimonies of the chart, in full — you may state these and nothing else:
${input.reasons.map((r) => `- ${r}`).join("\n")}

${circumstancesBlock(input.circumstances)}
Timing: ${input.timing ?? "the chart does not show the time"}

Write the judgment.`;
}
