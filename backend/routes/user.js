const express = require("express");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Submission = require("../models/Submission");
const Payment = require("../models/Payment");
const { authenticate } = require("../middleware/auth");
const { syncLevel, levelInfo, cleanLevel } = require("../services/levels");
const wallet = require("../services/wallet");
const { dateKey, monthKey, yesterdayKey, round2, wrap } = require("../utils/helpers");
const { fail } = require("../utils/errors");
const { referralLink } = require("../utils/links");

const router = express.Router();
router.use(authenticate);

function publicUser(u) {
  return {
    tgId: u.tgId,
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.username,
    photoUrl: u.photoUrl,
    balance: u.balance,
    totalEarned: u.totalEarned,
    totalDeposited: u.totalDeposited,
    totalWithdrawn: u.totalWithdrawn,
    referralEarnings: u.referralEarnings,
    level: u.level,
    tasksApproved: u.tasksApproved,
    referralCount: u.referralCount,
    withdrawDetails: {
      upi: u.withdrawDetails.upi,
      finzoWallet: u.withdrawDetails.finzoWallet,
    },
    language: u.language,
    theme: u.theme,
    customize: {
      accent: u.customize.accent,
      btnStyle: u.customize.btnStyle,
      cardStyle: u.customize.cardStyle,
    },
    notifications: u.notifications,
    hideName: u.hideName,
    hideBalance: u.hideBalance,
    createdAt: u.createdAt,
  };
}

const method = (m) => ({ enabled: m.enabled, min: m.min, max: m.max, dailyLimit: m.dailyLimit });

function publicConfig(s) {
  return {
    app: {
      name: s.app.name,
      botUsername: s.app.botUsername,
      supportLink: s.app.supportLink,
      channelLink: s.app.channelLink,
    },
    deposit: {
      enabled: s.deposit.enabled,
      min: s.deposit.min,
      max: s.deposit.max,
      feePercent: s.deposit.feePercent,
    },
    withdraw: {
      enabled: s.withdraw.enabled,
      approvalEnabled: s.withdraw.approvalEnabled,
      approvalAbove: s.withdraw.approvalAbove,
      upi: method(s.withdraw.upi),
      wallet: method(s.withdraw.wallet),
    },
    referral: {
      enabled: s.referral.enabled,
      reward: s.referral.reward,
      payOn: s.referral.payOn,
    },
    checkin: { enabled: s.checkin.enabled, rewards: s.checkin.rewards },
    club: { enabled: s.club.enabled },
    proof: { maxSizeMB: s.proof.maxSizeMB },
    levels: (s.levels || []).map(cleanLevel),
    categories: (s.categories || []).map((c) => ({ id: c.id, en: c.en, icon: c.icon })),
    faq: s.faq,
  };
}

function effectiveStreak(user, tz) {
  const last = user.checkin.lastDate;
  if (last === dateKey(new Date(), tz) || last === yesterdayKey(tz)) return user.checkin.streak;
  return 0;
}

router.get(
  "/me",
  wrap(async (req, res) => {
    const { user, settings } = req;
    await syncLevel(user, settings);

    const tz = settings.app.timezone;
    const today = dateKey(new Date(), tz);
    const streak = effectiveStreak(user, tz);
    const rewards = settings.checkin.rewards && settings.checkin.rewards.length ? settings.checkin.rewards : [0];
    const doneToday = user.checkin.lastDate === today;

    const [pendingProofs, pendingWithdraws, withdrawalsThisMonth] = await Promise.all([
      Submission.countDocuments({ tgId: user.tgId, status: "pending" }),
      Payment.countDocuments({
        tgId: user.tgId,
        type: "withdraw",
        status: { $in: ["awaiting_approval", "processing"] },
      }),
      Payment.countDocuments({
        tgId: user.tgId,
        type: "withdraw",
        status: { $in: ["created", "awaiting_approval", "processing", "success"] },
        monthKey: monthKey(new Date(), tz),
      }),
    ]);

    res.json({
      user: publicUser(user),
      level: levelInfo(settings, user),
      isAdmin: req.isAdmin,
      checkin: {
        enabled: settings.checkin.enabled,
        streak,
        doneToday,
        nextReward: rewards[streak % rewards.length],
        rewards,
      },
      stats: { pendingProofs, pendingWithdraws, withdrawalsThisMonth },
      referral: { code: String(user.tgId), link: referralLink(settings, user.tgId) },
      config: publicConfig(settings),
    });
  })
);

router.post(
  "/checkin",
  wrap(async (req, res) => {
    const { user, settings } = req;
    const c = settings.checkin;
    if (!c.enabled) throw fail(400, "Daily check-in is disabled");

    const tz = settings.app.timezone;
    const today = dateKey(new Date(), tz);
    const yesterday = yesterdayKey(tz);
    if (user.checkin.lastDate === today) throw fail(400, "You already checked in today");

    const streak = user.checkin.lastDate === yesterday ? user.checkin.streak + 1 : 1;
    const updated = await User.findOneAndUpdate(
      { _id: user._id, "checkin.lastDate": { $ne: today } },
      { $set: { "checkin.lastDate": today, "checkin.streak": streak }, $inc: { "checkin.total": 1 } },
      { new: true }
    );
    if (!updated) throw fail(400, "You already checked in today");

    const rewards = c.rewards && c.rewards.length ? c.rewards : [0];
    const reward = round2(rewards[(streak - 1) % rewards.length]);
    let balance = updated.balance;
    if (reward > 0) {
      const u2 = await wallet.credit(updated._id, reward, "checkin", `Day ${streak} check-in`, "", {
        totalEarned: reward,
      });
      balance = u2.balance;
    }
    res.json({ streak, reward, balance });
  })
);

router.patch(
  "/prefs",
  wrap(async (req, res) => {
    const b = req.body || {};
    const set = {};

    if (b.language !== undefined) {
      if (!["en", "bn"].includes(b.language)) throw fail(400, "Invalid language");
      set.language = b.language;
    }
    if (b.theme !== undefined) {
      if (!["light", "dark", "auto"].includes(b.theme)) throw fail(400, "Invalid theme");
      set.theme = b.theme;
    }
    if (b.notifications !== undefined) set.notifications = !!b.notifications;
    if (b.hideName !== undefined) set.hideName = !!b.hideName;
    if (b.hideBalance !== undefined) set.hideBalance = !!b.hideBalance;

    const c = b.customize;
    if (c && typeof c === "object") {
      if (c.accent !== undefined) {
        if (c.accent !== "" && !/^#[0-9a-fA-F]{6}$/.test(c.accent)) throw fail(400, "Invalid color");
        set["customize.accent"] = c.accent;
      }
      if (c.btnStyle !== undefined) {
        if (!["round", "soft", "square"].includes(c.btnStyle)) throw fail(400, "Invalid button style");
        set["customize.btnStyle"] = c.btnStyle;
      }
      if (c.cardStyle !== undefined) {
        if (!["glass", "flat", "outline"].includes(c.cardStyle)) throw fail(400, "Invalid card style");
        set["customize.cardStyle"] = c.cardStyle;
      }
    }

    if (Object.keys(set).length) await User.updateOne({ _id: req.user._id }, { $set: set });
    const fresh = await User.findById(req.user._id);
    res.json({ user: publicUser(fresh) });
  })
);

router.put(
  "/withdraw-details",
  wrap(async (req, res) => {
    const b = req.body || {};
    const upi = String(b.upi || "").trim();
    const wal = String(b.finzoWallet || "").trim();

    if (upi && !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(upi)) {
      throw fail(400, "Invalid UPI ID (example: name@bank)");
    }
    if (wal && !/^\d{10}$/.test(wal)) {
      throw fail(400, "Invalid FINZO Wallet ID");
    }
    await User.updateOne(
      { _id: req.user._id },
      { $set: { "withdrawDetails.upi": upi, "withdrawDetails.finzoWallet": wal } }
    );
    res.json({ ok: true, withdrawDetails: { upi, finzoWallet: wal } });
  })
);

router.get(
  "/transactions",
  wrap(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const items = await Transaction.find({ tgId: req.user.tgId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({
      page,
      hasMore: items.length === limit,
      items: items.map((t) => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        note: t.note,
        createdAt: t.createdAt,
      })),
    });
  })
);

module.exports = router;
