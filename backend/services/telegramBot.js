const User = require("../models/User");
const Setting = require("../models/Setting");
const { getSettings, clearSettingsCache } = require("./settings");

const API = () => `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
const appUrl = () => process.env.APP_URL || "";

async function api(method, payload) {
  const res = await fetch(`${API()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const data = await res
    .json()
    .catch(() => ({ ok: false, description: "Bad response from Telegram" }));
  if (!data.ok) {
    const err = new Error(data.description || "Telegram error");
    err.code = data.error_code;
    err.retryAfter = data.parameters && data.parameters.retry_after;
    throw err;
  }
  return data.result;
}

function openAppButton(text) {
  return { text, web_app: { url: appUrl() } };
}

// text is HTML. Escape dynamic values before passing them in.
async function sendMessage(chatId, text, buttons) {
  const payload = {
    chat_id: chatId,
    text: String(text).slice(0, 4000),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (buttons && buttons.length) payload.reply_markup = { inline_keyboard: [buttons] };
  return api("sendMessage", payload);
}

// Bilingual notification (English + Bangla in one message).
async function notifyUser(user, en, bn, buttons, force = false) {
  try {
    if (!user) return false;
    if (!force && user.notifications === false) return false;
    if (user.botBlocked) return false;
    await sendMessage(user.tgId, `${en}\n\n${bn}`, buttons);
    return true;
  } catch (e) {
    if (e.code === 403) {
      User.updateOne({ tgId: user.tgId }, { $set: { botBlocked: true } }).catch(() => {});
    }
    return false;
  }
}

async function adminIds() {
  const env = (process.env.ADMIN_IDS || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  const s = await getSettings();
  return [...new Set([...env, ...(s.admins || [])])];
}

async function notifyAdmins(text) {
  const ids = await adminIds();
  for (const id of ids) {
    try {
      await sendMessage(id, text, [openAppButton("Open Admin Panel")]);
    } catch (e) {
      /* admin may not have started the bot */
    }
  }
}

// Upload a proof screenshot to the private channel.
async function uploadProof(buffer, mime, caption) {
  const channel = process.env.PROOF_CHANNEL_ID;
  if (!channel) throw new Error("PROOF_CHANNEL_ID environment variable is missing");
  const form = new FormData();
  form.append("chat_id", channel);
  form.append("caption", String(caption || "").slice(0, 1000));
  form.append(
    "photo",
    new Blob([buffer], { type: mime }),
    mime === "image/png" ? "proof.png" : "proof.jpg"
  );
  const res = await fetch(`${API()}/sendPhoto`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!data.ok) throw new Error(data.description || "Proof upload failed");
  const msg = data.result;
  const photo = msg.photo[msg.photo.length - 1];
  return {
    fileId: photo.file_id,
    fileUniqueId: photo.file_unique_id,
    messageId: msg.message_id,
  };
}

async function downloadFile(fileId) {
  const f = await api("getFile", { file_id: fileId });
  const r = await fetch(
    `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${f.file_path}`
  );
  if (!r.ok) throw new Error("Could not download file");
  const contentType = String(f.file_path).toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";
  return { buffer: Buffer.from(await r.arrayBuffer()), contentType };
}

// Called once at server start.
async function init() {
  if (!process.env.BOT_TOKEN) {
    console.warn("BOT_TOKEN missing: bot disabled");
    return;
  }
  try {
    const me = await api("getMe");
    const s = await getSettings();
    if (me.username && s.app.botUsername !== me.username) {
      await Setting.updateOne({ key: "main" }, { $set: { "app.botUsername": me.username } });
      clearSettingsCache();
    }
  } catch (e) {
    console.error("getMe failed:", e.message);
  }

  if (!appUrl()) return console.warn("APP_URL missing: webhook not set");
  if (!process.env.WEBHOOK_SECRET) return console.warn("WEBHOOK_SECRET missing: webhook not set");

  try {
    await api("setWebhook", {
      url: `${appUrl()}/bot/webhook`,
      secret_token: process.env.WEBHOOK_SECRET,
      allowed_updates: ["message", "my_chat_member"],
    });
    await api("setChatMenuButton", {
      menu_button: { type: "web_app", text: "Open TaskGenX", web_app: { url: appUrl() } },
    });
    await api("setMyCommands", {
      commands: [
        { command: "start", description: "Open TaskGenX" },
        { command: "help", description: "Help" },
      ],
    });
    console.log("Telegram webhook ready");
  } catch (e) {
    console.error("Webhook setup failed:", e.message);
  }
}

module.exports = {
  api,
  init,
  sendMessage,
  notifyUser,
  notifyAdmins,
  adminIds,
  openAppButton,
  uploadProof,
  downloadFile,
};
