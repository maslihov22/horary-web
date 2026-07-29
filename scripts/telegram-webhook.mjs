// Registers (or inspects) the bot's webhook.
//
//   node --env-file=.env scripts/telegram-webhook.mjs info
//   node --env-file=.env scripts/telegram-webhook.mjs set https://your-site/api/telegram
//   node --env-file=.env scripts/telegram-webhook.mjs delete
//
// Telegram will only post to a public HTTPS URL, so this cannot target
// localhost — use the deployed site, or a tunnel while developing.

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set (add it to .env)");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

const [action, url] = process.argv.slice(2);

if (action === "info") {
  const me = await api("getMe");
  const hook = await api("getWebhookInfo");
  if (me.ok) console.log(`bot: @${me.result.username} (${me.result.first_name})`);
  else console.log("getMe failed:", me.description);
  console.log("webhook:", JSON.stringify(hook.result ?? hook, null, 2));
} else if (action === "set") {
  if (!url) {
    console.error("usage: telegram-webhook.mjs set <https url>");
    process.exit(1);
  }
  if (!secret) {
    console.error("TELEGRAM_WEBHOOK_SECRET is not set — refusing to register an");
    console.error("unauthenticated webhook: anyone could then forge updates and");
    console.error("claim other people's readings.");
    process.exit(1);
  }
  const res = await api("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  console.log(res.ok ? `webhook set to ${url}` : `failed: ${res.description}`);
} else if (action === "delete") {
  const res = await api("deleteWebhook", { drop_pending_updates: true });
  console.log(res.ok ? "webhook deleted" : `failed: ${res.description}`);
} else {
  console.log("usage: telegram-webhook.mjs <info|set <url>|delete>");
  process.exit(1);
}
