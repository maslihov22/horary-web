import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import type { Reading } from "./reading";
import type { Verdict } from "@/engine/types";

// Access model: possession, not accounts.
//
// A reading's id is an unguessable secret — 24 characters from a 62-symbol
// alphabet, so 62^24 possibilities. Even at an absurd ten thousand guesses a
// second against a hundred thousand stored readings, a single hit would take
// longer than the universe has existed. Brute force is not the threat.
//
// Leakage is. Links end up in chat logs, clipboards, browser history, proxy
// logs. Horary questions are intimate — health, money, infidelity — so the link
// alone is deliberately not enough: the browser that cast the reading also
// holds the same secret in an httpOnly cookie, and that cookie is what proves
// ownership. A leaked link opens nothing on its own.

const ID_BYTES = 18; // 18 bytes → 24 base64url characters
const COOKIE_PREFIX = "hr_";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // a year

export function newReadingId(): string {
  return randomBytes(ID_BYTES).toString("base64url");
}

/** What the querent's own browser is given, proving this reading is theirs. */
function cookieName(id: string): string {
  return COOKIE_PREFIX + id;
}

export interface StoredReading extends Reading {
  id: string;
  question: string;
  house: number;
  narration: string;
  fallback: boolean;
  place: { lat: number; lon: number; label: string; known: boolean };
  moment: string;
  paid: boolean;
  createdAt: string;
}

export interface SaveInput {
  question: string;
  house: number;
  moment: string;
  place: { lat: number; lon: number; label: string };
  reading: Reading;
  narration: string;
  fallback: boolean;
}

/** Persists a judged reading and marks this browser as its owner. */
export async function saveReading(input: SaveInput): Promise<string> {
  const id = newReadingId();
  const v = input.reading.verdict;

  await db.reading.create({
    data: {
      id,
      question: input.question,
      house: input.house,
      askedAt: new Date(input.moment),
      lat: input.place.lat,
      lon: input.place.lon,
      placeLabel: input.place.label,
      verdict: v.verdict,
      confidence: v.confidence,
      reasons: v.reasons,
      timing: v.timing,
      circumstances: v.circumstances as unknown as object,
      chart: input.reading.chart as unknown as object,
      querentPlanet: input.reading.querent.planet,
      querentSign: input.reading.querent.sign,
      querentDeg: input.reading.querent.deg,
      querentMin: input.reading.querent.min,
      quesitedPlanet: input.reading.quesited.planet,
      quesitedSign: input.reading.quesited.sign,
      quesitedDeg: input.reading.quesited.deg,
      quesitedMin: input.reading.quesited.min,
      narration: input.narration,
      fallback: input.fallback,
    },
  });

  await grantCookie(id);
  return id;
}

/** Does this browser hold the cookie that proves it cast this reading? */
export async function ownsReading(id: string): Promise<boolean> {
  const jar = await cookies();
  return jar.get(cookieName(id))?.value === id;
}

/** Grants this browser the ownership cookie. */
async function grantCookie(id: string): Promise<void> {
  const jar = await cookies();
  jar.set(cookieName(id), id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

const ACCESS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // a week

/** Issues a fresh single-use token for a reading the bot is keeping. */
export async function issueAccessToken(id: string): Promise<string> {
  const token = randomBytes(ID_BYTES).toString("base64url");
  await db.reading.update({
    where: { id },
    data: { accessToken: token, accessExpires: new Date(Date.now() + ACCESS_TTL_MS) },
  });
  return token;
}

/**
 * Redeems a token from a bot link, granting this browser the cookie.
 *
 * Single use: the token is cleared as it is spent, so a forwarded message
 * cannot be replayed by whoever else reads it. The bot will mint another on
 * request, which is the recovery path.
 */
export async function redeemAccessToken(id: string, token: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return false;

  const row = await db.reading.findUnique({
    where: { id },
    select: { accessToken: true, accessExpires: true },
  });
  if (!row?.accessToken || row.accessToken !== token) return false;
  if (!row.accessExpires || row.accessExpires.getTime() < Date.now()) return false;

  await db.reading.update({
    where: { id },
    data: { accessToken: null, accessExpires: null },
  });
  await grantCookie(id);
  return true;
}

export type ReadingAccess =
  | { status: "ok"; reading: StoredReading }
  | { status: "not-found" }
  | { status: "forbidden" };

/**
 * Fetches a reading, but only for the browser that cast it.
 *
 * A stranger holding the link gets `forbidden` rather than `not-found`: the
 * reading does exist, they simply cannot open it here, and saying so is what
 * lets them recover it by email instead of assuming the link is broken.
 */
export async function getReading(id: string): Promise<ReadingAccess> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) return { status: "not-found" };

  const row = await db.reading.findUnique({ where: { id } });
  if (!row) return { status: "not-found" };
  if (!(await ownsReading(id))) return { status: "forbidden" };

  return {
    status: "ok",
    reading: {
      id: row.id,
      question: row.question,
      house: row.house,
      moment: row.askedAt.toISOString(),
      place: { lat: row.lat, lon: row.lon, label: row.placeLabel, known: true },
      verdict: {
        verdict: row.verdict as "yes" | "no" | "qualified",
        confidence: row.confidence,
        reasons: row.reasons as string[],
        timing: row.timing,
        // Readings cast before the engine read accidental condition have none.
        circumstances: row.circumstances as unknown as Verdict["circumstances"],
      },
      chart: row.chart as unknown as Reading["chart"],
      positions: [],
      querent: {
        planet: row.querentPlanet as Reading["querent"]["planet"],
        sign: row.querentSign,
        deg: row.querentDeg,
        min: row.querentMin,
      },
      quesited: {
        planet: row.quesitedPlanet as Reading["quesited"]["planet"],
        sign: row.quesitedSign,
        deg: row.quesitedDeg,
        min: row.quesitedMin,
      },
      narration: row.narration,
      fallback: row.fallback,
      paid: row.paid,
      createdAt: row.createdAt.toISOString(),
    },
  };
}
