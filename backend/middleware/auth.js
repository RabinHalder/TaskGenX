const crypto = require("crypto");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { getSettings } = require("../services/settings");
const wallet = require("../services/wallet");
const { round2 } = require("../utils/helpers");

function envAdminIds() {
  return (process.env.ADMIN_IDS || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

async function isAdmin(tgId) {
  if (envAdminIds().includes(tgId)) return true;
  const settings = await getSettings();
  return (settings.admins || []).includes(tgId);
}

// Telegram Mini App initData verification (HMAC-SHA256).
function verifyInitData(initData) {
  if (!initData || typeof initData !== "string") return null;
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN environment variable is missing");

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const calculated = crypto.createHmac("sha256", secret).update(dataCheckString).digest();
  const received = Buffer.from(hash, "hex");
  if (received.length !== calculated.length || !crypto.timingSafeEqual(received, calculated)) {
    return null;
  }

  const authDate = Number(params.get("auth_date") || 0);
  const maxAge = Number(process.env.INITDATA_MAX_AGE_SECONDS || 86400);
  if (!authDate || Date.now() / 1000 - authDate > maxAge) return null;

  let user;
  try {
    user = JSON.parse(params.get("user"));
  } catch (e) {
    return null;
  }
  if (!user || !user.id) return null;

  return { user, startParam: params.get("start_param") || null };
}

async function createUser(tg, startParam) {
  const doc = {
    tgId: tg.id,
    firstName: tg.first_name || "",
    lastName: tg.last_name || "",
    username: tg.username || "",
    photoUrl: tg.photo_url || "",
  };

  // Referral: start param = referrer's Telegram ID (single level)
  const refId = Number(startParam);
  if (Number.isInteger(refId) && refId > 0 && refId !== tg.id) {
    const referrer = await User.findOne({ tgId: refId });
    if (referrer && !referrer.isBanned) doc.referredBy = referrer.tgId;
  }

  let user;
  try {
    user = await User.create(doc);
  } catch (e) {
    if (e.code === 11000) return User.findOne({ tgId: tg.id }); // created by a parallel request
    throw e;
  }

  if (doc.referredBy) {
    await User.updateOne({ tgId: doc.referredBy }, { $inc: { referralCount: 1 } });
  }

  const settings = await getSettings();

  // Welcome bonus (amount comes from Settings)
  const welcome = round2(settings.bonus && settings.bonus.welcome);
  if (welcome > 0) {
    user = await User.findOneAndUpdate({ _id: user._id }, { $inc: { balance: welcome } }, { new: true });
    await Transaction.create({
      user: user._id,
      tgId: user.tgId,
      type: "bonus",
      amount: welcome,
      balanceAfter: user.balance,
      note: "Welcome bonus",
    });
  }

  // Referral reward when "pay on join" is selected in Settings
  if (doc.referredBy) {
    try {
      await wallet.rewardReferral(user, "join", settings);
    } catch (e) {
      console.error("Referral reward failed:", e.message);
    }
  }

  return user;
}

async function authenticate(req, res, next) {
  try {
    const data = verifyInitData(req.get("x-telegram-init-data"));
    if (!data) {
      return res.status(401).json({ error: "unauthorized", message: "Invalid Telegram session" });
    }

    const tg = data.user;
    let user = await User.findOne({ tgId: tg.id });
    if (!user) {
      user = await createUser(tg, data.startParam);
    } else {
      const patch = {};
      const first = tg.first_name || "";
      const last = tg.last_name || "";
      const uname = tg.username || "";
      const photo = tg.photo_url || user.photoUrl || "";
      if (user.firstName !== first) patch.firstName = first;
      if (user.lastName !== last) patch.lastName = last;
      if (user.username !== uname) patch.username = uname;
      if (user.photoUrl !== photo) patch.photoUrl = photo;
      if (!user.lastSeenAt || Date.now() - user.lastSeenAt.getTime() > 60 * 1000) {
        patch.lastSeenAt = new Date();
      }
      if (user.botBlocked) patch.botBlocked = false;
      if (Object.keys(patch).length) {
        await User.updateOne({ _id: user._id }, { $set: patch });
        user.set(patch);
      }
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "banned", message: user.banReason || "Your account is banned" });
    }

    const admin = await isAdmin(user.tgId);
    const settings = await getSettings();
    if (settings.app.maintenance && !admin) {
      return res.status(503).json({ error: "maintenance", message: settings.app.maintenanceMessage });
    }

    req.user = user;
    req.isAdmin = admin;
    req.tg = tg;
    req.settings = settings;
    next();
  } catch (err) {
    next(err);
  }
}

// Use on the whole admin router. It runs authenticate() itself.
function requireAdmin(req, res, next) {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    if (!req.isAdmin) {
      return res.status(403).json({ error: "forbidden", message: "Admins only" });
    }
    next();
  });
}

module.exports = { authenticate, requireAdmin, verifyInitData, isAdmin };
