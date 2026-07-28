import "server-only";

// Minimal OpenRouter client. No SDK — one endpoint, one shape, and keeping it
// dependency-free means nothing between us and the wire when a call misbehaves.

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Cheapest of the v4 line: $0.14/M in, $0.28/M out. A reading costs ~$0.0005. */
export const MODEL = "deepseek/deepseek-v4-flash";

export class LlmError extends Error {}

export async function chat(opts: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  json?: boolean;
  signal?: AbortSignal;
}): Promise<string> {
  const key = process.env.AI_KEY_OPENROUTER;
  if (!key) throw new LlmError("AI_KEY_OPENROUTER is not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // OpenRouter attributes traffic with these; harmless if unset.
      "HTTP-Referer": "https://horary.app",
      "X-Title": "Horary",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: opts.signal ?? AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LlmError(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const choice = data?.choices?.[0];
  const text: unknown = choice?.message?.content;

  if (typeof text !== "string" || !text.trim()) {
    // Usually means the token budget was spent on reasoning before any content
    // was emitted — worth saying plainly, since the fix is a bigger budget.
    const reason = choice?.finish_reason ?? "unknown";
    throw new LlmError(`OpenRouter returned an empty completion (finish_reason: ${reason})`);
  }
  if (choice?.finish_reason === "length") {
    throw new LlmError("truncated: the model hit the token limit mid-answer");
  }
  return text.trim();
}

/** Strips a ``` fence if the model wrapped its JSON despite being told not to. */
export function parseJsonLoose(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start > 0 || end < s.length - 1) {
    if (start !== -1 && end > start) s = s.slice(start, end + 1);
  }
  return JSON.parse(s);
}
