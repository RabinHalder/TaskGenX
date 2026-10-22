const crypto = require("crypto");
const express = require("express");
const User = require("../models/User");
const bot = require("../services/telegramBot");
const { getSettings } = require("../services/settings");

const router = express.Router();

function secretOk(req) {
  const expected = process.env.WEBHOOK_SECRET || "";
  const given = req.get("x-telegram-bot-api-secret-token") || "";
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

async function handleUpdate(update) {
  if (update.my_chat_member && update.my_chat_member.chat.type === "private") {
    const st = update.my_chat_member.new_chat_member.status;
    await User.updateOne(
      { tgId: update.my_chat_member.chat.id },
      { $set: { botBlocked: st === "kicked" || st === "left" } }
    );
    return;
  }

  const msg = update.message;
  if (!msg || msg.chat.type !== "private") return;

  const text = String(msg.text || "");
  const settings = await getSettings();
  const name = settings.app.name || "TaskGenX";

  if (text.startsWith("/help")) {
    await bot.sendMessage(
      msg.chat.id,
      `<b>${name}</b>: complete simple tasks, upload proof and earn money. Open the app to start.\n\n<b>${name}</b>: সহজ টাস্ক সম্পন্ন করুন, প্রমাণ আপলোড করুন এবং টাকা আয় করুন। শুরু করতে অ্যাপ খুলুন।`,
      [bot.openAppButton("Open " + name)]
    );
    return;
  }

  // /start (optionally /start <referrer id>)
  let button = bot.openAppButton("Open " + name);
  const param = text.split(" ")[1];
  if (param && /^\d+$/.test(param) && settings.app.botUsername) {
    // A direct app link carries the referral code into the Mini App
    const short = settings.app.appShortName;
    const url = short
      ? `https://t.me/${settings.app.botUsername}/${short}?startapp=${param}`
      : `https://t.me/${settings.app.botUsername}?startapp=${param}`;
    button = { text: "Open " + name, url };
  }

  await bot.sendMessage(
    msg.chat.id,
    `Welcome to <b>${name}</b>!\nComplete tasks, earn money and withdraw easily.\n\n<b>${name}</b>-এ স্বাগতম!\nটাস্ক সম্পন্ন করুন, টাকা আয় করুন এবং সহজে উইথড্র করুন।`,
    [button]
  );
}

router.post("/webhook", (req, res) => {
  if (!secretOk(req)) return res.sendStatus(401);
  res.sendStatus(200);
  handleUpdate(req.body || {}).catch((e) => console.error("Bot update error:", e.message));
});

module.exports = router;
