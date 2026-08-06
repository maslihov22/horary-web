import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { parseCommand, sendMessage, isBotConfigured } from "@/app/telegram";
import { issueAccessToken } from "@/app/readings-store";

// The bot's webhook. Telegram posts every update here.
//
// The endpoint is public, so the secret token registered with setWebhook is what
// proves an update actually came from Telegram. Without that check anyone could
// POST a forged update and claim someone else's reading — losing the very
// property that makes the chat id better than a typed username.

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

/**
 * A link the recipient can actually open.
 *
 * The bare address is useless from Telegram: the browser that follows it holds
 * no cookie and cannot prove ownership. So each link carries a single-use token
 * and points at /open, which spends it for the cookie and then redirects to the
 * reading's clean address — the token never reaches the address bar.
 *
 * Without a configured site url there is no absolute address to send, and a
 * relative one is not clickable in a chat. Better to send the bare reading link
 * than a broken one.
 */
async function readingLink(id: string): Promise<string> {
  const base = siteUrl();
  if (!base) return `/r/${id}`;
  const token = await issueAccessToken(id);
  return `${base}/r/${id}/open?k=${token}`;
}

const VERDICT_WORD: Record<string, string> = {
  yes: "Yes",
  no: "No",
  qualified: "With conditions",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  if (!isBotConfigured()) return NextResponse.json({ ok: true });

  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const given = req.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || given !== expected) {
    // Answer 200 even when rejecting: a 4xx makes Telegram retry, and a forged
    // update is not a transient failure.
    console.warn("[telegram] rejected an update with a bad secret token");
    return NextResponse.json({ ok: true });
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const cmd = parseCommand(update);
  if (!cmd) return NextResponse.json({ ok: true });

  const name = cmd.firstName ? `, ${cmd.firstName}` : "";

  if (cmd.kind === "readings") {
    const rows = await db.reading.findMany({
      where: { telegramChatId: cmd.chatId },
      select: { id: true, question: true, verdict: true, askedAt: true },
      orderBy: { askedAt: "desc" },
      take: 20,
    });

    if (rows.length === 0) {
      await sendMessage(
        cmd.chatId,
        "I am not keeping any readings for you yet.\n\nAsk a question, then press <b>Keep in Telegram</b> under the judgment.",
      );
      return NextResponse.json({ ok: true });
    }

    const list = (
      await Promise.all(
        rows.map(async (r) => {
          const when = r.askedAt.toISOString().slice(0, 10);
          const link = await readingLink(r.id);
          return `${when} — <b>${VERDICT_WORD[r.verdict] ?? r.verdict}</b>\n${escapeHtml(r.question)}\n${link}`;
        }),
      )
    ).join("\n\n");

    await sendMessage(cmd.chatId, `Your readings:\n\n${list}`);
    return NextResponse.json({ ok: true });
  }

  if (cmd.kind === "other") {
    await sendMessage(
      cmd.chatId,
      `I only keep readings${name} — I do not judge questions here.\n\nAsk at ${siteUrl() || "the site"}, or send /readings to see what I am holding for you.`,
    );
    return NextResponse.json({ ok: true });
  }

  // Plain /start — someone opened the bot directly.
  if (!cmd.payload) {
    await sendMessage(
      cmd.chatId,
      `Welcome${name}.\n\nI keep your horary readings so you can return to them from any device.\n\nAsk a question at ${siteUrl() || "the site"} and press <b>Keep in Telegram</b> under the judgment.`,
    );
    return NextResponse.json({ ok: true });
  }

  // /start <readingId> — the deep link under a judgment.
  const id = cmd.payload;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    await sendMessage(cmd.chatId, "That link is not one of mine.");
    return NextResponse.json({ ok: true });
  }

  const reading = await db.reading.findUnique({
    where: { id },
    select: { id: true, question: true, verdict: true, timing: true, telegramChatId: true },
  });

  if (!reading) {
    await sendMessage(cmd.chatId, "I cannot find that reading. The link may be mistyped.");
    return NextResponse.json({ ok: true });
  }

  // Claimed by another account: neither move it nor reveal anything about it.
  if (reading.telegramChatId !== null && reading.telegramChatId !== cmd.chatId) {
    await sendMessage(
      cmd.chatId,
      "That reading is already kept by another account, so I cannot add it here.",
    );
    return NextResponse.json({ ok: true });
  }

  if (reading.telegramChatId === null) {
    await db.reading.update({
      where: { id },
      data: { telegramChatId: cmd.chatId, claimedAt: new Date() },
    });
  }

  const timing = reading.timing ? `\nPerfects ${reading.timing}` : "";
  const link = await readingLink(reading.id);
  await sendMessage(
    cmd.chatId,
    `Kept${name}.\n\n<b>${escapeHtml(reading.question)}</b>\nJudgment: ${VERDICT_WORD[reading.verdict] ?? reading.verdict}${timing}\n\n${link}\n\nSend /readings any time to see everything I am keeping for you.`,
  );

  return NextResponse.json({ ok: true });
}
