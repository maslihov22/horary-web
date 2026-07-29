import "server-only";

// Telegram, used as the recovery channel instead of email.
//
// The point of the deep link is that identity comes from Telegram rather than
// from the querent. Pressing Start on t.me/<bot>?start=<readingId> makes
// Telegram deliver "/start <readingId>" together with the sender's numeric chat
// id — which cannot be forged from a form, never changes, and exists for every
// account. A typed @username would fail on all three counts, and the Bot API
// cannot open a private chat by username anyway.

const API = "https://api.telegram.org";

export function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

export function botUsername(): string | null {
  return process.env.TELEGRAM_BOT_USERNAME ?? null;
}

export function isBotConfigured(): boolean {
  return Boolean(botToken() && botUsername());
}

/** The link that claims a reading. The payload is the reading's own id. */
export function claimLink(readingId: string): string | null {
  const name = botUsername();
  if (!name) return null;
  // Telegram allows A-Z a-z 0-9 _ - up to 64 chars — base64url ids fit as-is.
  return `https://t.me/${name}?start=${readingId}`;
}

interface TelegramResult {
  ok: boolean;
  description?: string;
}

async function call(method: string, body: unknown): Promise<TelegramResult> {
  const token = botToken();
  if (!token) return { ok: false, description: "TELEGRAM_BOT_TOKEN is not set" };

  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, description: data.description ?? `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, description: err instanceof Error ? err.message : "network error" };
  }
}

export async function sendMessage(
  chatId: bigint | number,
  text: string,
  opts?: { markup?: unknown },
): Promise<TelegramResult> {
  return call("sendMessage", {
    chat_id: String(chatId),
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(opts?.markup ? { reply_markup: opts.markup } : {}),
  });
}

/** Registers the webhook. `secret` is echoed back on every update. */
export async function setWebhook(url: string, secret: string): Promise<TelegramResult> {
  return call("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
}

/** The slice of an update this bot acts on. */
export interface Command {
  kind: "start" | "readings" | "other";
  chatId: bigint;
  firstName: string;
  payload: string | null;
}

export function parseCommand(update: unknown): Command | null {
  const u = update as {
    message?: {
      text?: string;
      chat?: { id?: number; type?: string };
      from?: { first_name?: string };
    };
  };
  const msg = u?.message;
  const text = msg?.text?.trim();
  const chatId = msg?.chat?.id;

  if (!text || typeof chatId !== "number") return null;
  if (msg?.chat?.type !== "private") return null; // never act in groups

  const base = { chatId: BigInt(chatId), firstName: msg?.from?.first_name ?? "" };

  if (text.startsWith("/start")) {
    const rest = text.slice("/start".length).trim();
    return { ...base, kind: "start", payload: rest ? rest.split(/\s+/)[0] : null };
  }
  // Commands may arrive as /readings@botname in some clients.
  if (/^\/readings(@\w+)?$/.test(text)) {
    return { ...base, kind: "readings", payload: null };
  }
  return { ...base, kind: "other", payload: null };
}
