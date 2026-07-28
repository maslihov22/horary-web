import { NextResponse } from "next/server";
import { classify } from "@/app/llm/classify";
import { narrate } from "@/app/llm/narrate";
import { HOUSE_TOPICS } from "@/app/llm/prompts";
import { makeReading } from "@/app/reading";
import { LlmError } from "@/app/llm/client";

// Step 1 of the flow: read the question, propose a topic. Nothing is computed
// yet — the querent confirms first, because a chart cast on the wrong house is
// a confident answer to a question they did not ask.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const { question, house, utc, lat, lon } = (body ?? {}) as Record<string, unknown>;

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }

  try {
    // No confirmed house yet -> classify and ask.
    if (house === undefined || house === null) {
      const c = await classify(question);
      return NextResponse.json({ stage: "confirm", ...c });
    }

    const h = Number(house);
    if (!Number.isInteger(h) || h < 1 || h > 12) {
      return NextResponse.json({ error: "Unknown topic" }, { status: 400 });
    }

    // Confirmed. The moment of the question is the moment it was asked.
    const moment = typeof utc === "string" ? utc : new Date().toISOString();
    const latitude = typeof lat === "number" ? lat : 51.5;
    const longitude = typeof lon === "number" ? lon : -0.1167;

    const reading = makeReading(moment, latitude, longitude, h);

    const narration = await narrate({
      question: question.trim(),
      topicLabel: HOUSE_TOPICS[h - 1].label,
      verdict: reading.verdict.verdict,
      confidence: reading.verdict.confidence,
      reasons: reading.verdict.reasons,
      timing: reading.verdict.timing,
      querent: reading.querent,
      quesited: reading.quesited,
    });

    return NextResponse.json({
      stage: "reading",
      question: question.trim(),
      house: h,
      verdict: reading.verdict,
      chart: reading.chart,
      positions: reading.positions,
      querent: reading.querent,
      quesited: reading.quesited,
      narration: narration.text,
      fallback: narration.fallback,
    });
  } catch (err) {
    const msg = err instanceof LlmError ? err.message : "The reading could not be cast.";
    console.error("[reading]", err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
