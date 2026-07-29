import { NextResponse } from "next/server";
import { classify } from "@/app/llm/classify";
import { narrate } from "@/app/llm/narrate";
import { HOUSE_TOPICS } from "@/app/llm/prompts";
import { makeReading } from "@/app/reading";
import { LlmError } from "@/app/llm/client";
import { placeFromHeaders, type Place } from "@/app/geo";
import { saveReading } from "@/app/readings-store";
import { claimLink } from "@/app/telegram";

/** A location the querent supplied themselves, if it is usable. */
function chosenPlace(lat: unknown, lon: unknown, label: unknown): Place | null {
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return {
    lat,
    lon,
    label: typeof label === "string" && label.trim() ? label.trim().slice(0, 80) : "your location",
    known: true,
  };
}

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

  const { question, house, utc, lat, lon, placeLabel } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }

  try {
    // No confirmed house yet -> classify and ask. The place is resolved here,
    // on the first request, so the querent can see and correct it while the
    // topic is being confirmed.
    if (house === undefined || house === null) {
      const c = await classify(question);
      return NextResponse.json({
        stage: "confirm",
        ...c,
        place: placeFromHeaders(req.headers),
      });
    }

    const h = Number(house);
    if (!Number.isInteger(h) || h < 1 || h > 12) {
      return NextResponse.json({ error: "Unknown topic" }, { status: 400 });
    }

    // Confirmed. The chart belongs to the moment the question was asked — the
    // client stamps that when the querent submits, and carries it through the
    // topic confirmation, so the seconds spent classifying do not move the
    // ascendant. A stamp that is missing, unparseable, or wildly out of step
    // with the server clock is not trusted.
    const stamped = typeof utc === "string" ? Date.parse(utc) : NaN;
    const drift = Math.abs(Date.now() - stamped);
    const moment = Number.isFinite(stamped) && drift < 10 * 60_000
      ? new Date(stamped).toISOString()
      : new Date().toISOString();

    // Place: the querent's correction if they made one, else the edge's guess.
    const place = chosenPlace(lat, lon, placeLabel) ?? placeFromHeaders(req.headers);

    const reading = makeReading(moment, place.lat, place.lon, h);

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

    // Persist before answering, so the reading survives a reload and has an
    // address of its own. The cookie set here is what will later prove this
    // browser cast it.
    const id = await saveReading({
      question: question.trim(),
      house: h,
      moment,
      place,
      reading,
      narration: narration.text,
      fallback: narration.fallback,
    });

    return NextResponse.json({
      stage: "reading",
      id,
      // Absent until a bot is configured; the UI then simply omits the offer.
      claimUrl: claimLink(id),
      question: question.trim(),
      house: h,
      place,
      moment,
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
