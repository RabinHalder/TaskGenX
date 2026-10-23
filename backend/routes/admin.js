const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Task = require("../models/Task");
const Submission = require("../models/Submission");
const Transaction = require("../models/Transaction");
const Payment = require("../models/Payment");
const Setting = require("../models/Setting");
const { requireAdmin, isAdmin } = require("../middleware/auth");
const { getSettings, clearSettingsCache } = require("../services/settings");
const wallet = require("../services/wallet");
const payments = require("../services/payments");
const bot = require("../services/telegramBot");
const { round2, dateKey, fullName, escapeHtml, wrap } = require("../utils/helpers");
const { fail } = require("../utils/errors");

const router = express.Router();
router.use(requireAdmin);

const PAGE = 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------ helpers ------------------------------ */

function pageOf(req) {
  return Math.max(1, parseInt(req.query.page) || 1);
}

function oid(id, message = "Not found") {
  if (!mongoose.isValidObjectId(id)) throw fail(404, message);
  return id;
}

function num(v, name, { min = -Infinity, max = Infinity, int = false } = {}) {
  const n = Number(v);
  if (v === "" || v === null || v === undefined || !Number.isFinite(n)) {
    throw fail(400, `${name} must be a number`);
  }
  if (int && !Number.isInteger(n)) throw fail(400, `${name} must be a whole number`);
  if (n < min || n > max) throw fail(400, `${name} must be between ${min} and ${max}`);
  return n;
}

function str(v, name, max = 200, { required = false } = {}) {
  const s = v === undefined || v === null ? "" : String(v).trim();
  if (required && !s) throw fail(400, `${name} is required`);
  if (s.length > max) throw fail(400, `${name} is too long`);
  return s;
}

function bool(v) {
  return v === true || v === "true" || v === 1;
}

function urlOrEmpty(v, name) {
  const s = str(v, name, 500);
  if (!s) return "";
  if (!/^https?:\/\/[^\s]+$/i.test(s)) throw fail(400, `${name} must start with https://`);
  return s;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validTz(tz) {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}

function envAdminIds() {
  return (process.env.ADMIN_IDS || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function userBrief(u) {
  return {
    tgId: u.tgId,
    name: fullName(u),
    username: u.username || "",
    photoUrl: u.photoUrl || "",
  };
}

async function userMap(tgIds) {
  const users = await User.find({ tgId: { $in: [...new Set(tgIds)] } })
    .select("tgId firstName lastName username photoUrl")
    .lean();
  const map = {};
  users.forEach((u) => (map[u.tgId] = u));
  return map;
}

/* ------------------------------ DASHBOARD ------------------------------ */

function lastDays(tz, n = 7) {
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dateKey(new Date(Date.now() - i * 86400000), tz));
  }
  return keys;
}

function dayExpr(field, tz) {
  return { $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone: tz } };
}

function toMap(rows) {
  const m = {};
  rows.forEach((r) => (m[r._id] = r));
  return m;
}

router.get(
  "/dashboard",
  wrap(async (req, res) => {
    const tz = req.settings.app.timezone;
    const days = lastDays(tz, 7);
    const since = new Date(Date.now() - 8 * 86400000);
    const day24 = new Date(Date.now() - 86400000);

    const [
      totalUsers,
      active24h,
      banned,
      pendingProofs,
      pendingWithdrawals,
      processingWithdrawals,
      pendingDeposits,
      activeTasks,
      paymentTotals,
      liability,
      usersByDay,
      depositsByDay,
      withdrawsByDay,
      tasksByDay,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastSeenAt: { $gte: day24 } }),
      User.countDocuments({ isBanned: true }),
      Submission.countDocuments({ status: "pending" }),
      Payment.countDocuments({ type: "withdraw", status: "awaiting_approval" }),
      Payment.countDocuments({ type: "withdraw", status: "processing" }),
      Payment.countDocuments({ type: "deposit", status: "pending" }),
      Task.countDocuments({ active: true }),
      Payment.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: "$type",
            amount: { $sum: "$amount" },
            net: { $sum: "$netAmount" },
            fee: { $sum: "$fee" },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: dayExpr("createdAt", tz), n: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { type: "deposit", status: "success", updatedAt: { $gte: since } } },
        { $group: { _id: dayExpr("updatedAt", tz), total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        { $match: { type: "withdraw", status: "success", updatedAt: { $gte: since } } },
        { $group: { _id: dayExpr("updatedAt", tz), total: { $sum: "$netAmount" } } },
      ]),
      Submission.aggregate([
        { $match: { status: "approved", reviewedAt: { $gte: since } } },
        { $group: { _id: dayExpr("reviewedAt", tz), n: { $sum: 1 } } },
      ]),
    ]);

    const pt = {};
    paymentTotals.forEach((r) => (pt[r._id] = r));
    const dep = pt.deposit || { amount: 0, net: 0, fee: 0, count: 0 };
    const wd = pt.withdraw || { amount: 0, net: 0, fee: 0, count: 0 };

    const um = toMap(usersByDay);
    const dm = toMap(depositsByDay);
    const wm = toMap(withdrawsByDay);
    const tm = toMap(tasksByDay);

    res.json({
      kpis: {
        totalUsers,
        newToday: um[days[days.length - 1]] ? um[days[days.length - 1]].n : 0,
        active24h,
        banned,
        activeTasks,
        totalDeposited: round2(dep.amount),
        totalWithdrawn: round2(wd.net),
        depositCount: dep.count,
        withdrawCount: wd.count,
        feeRevenue: round2(dep.fee + wd.fee),
        userBalances: round2(liability[0] ? liability[0].total : 0),
      },
      pending: {
        proofs: pendingProofs,
        withdrawalsToApprove: pendingWithdrawals,
        withdrawalsProcessing: processingWithdrawals,
        depositsOpen: pendingDeposits,
      },
      chart: {
        days,
        newUsers: days.map((d) => (um[d] ? um[d].n : 0)),
        deposits: days.map((d) => round2(dm[d] ? dm[d].total : 0)),
        withdrawals: days.map((d) => round2(wm[d] ? wm[d].total : 0)),
        tasksApproved: days.map((d) => (tm[d] ? tm[d].n : 0)),
      },
    });
  })
);

/* ------------------------------ USERS ------------------------------ */

router.get(
  "/users",
  wrap(async (req, res) => {
    const page = pageOf(req);
    const q = String(req.query.q || "").trim().slice(0, 60);
    const filter = {};

    if (q) {
      if (/^\d+$/.test(q)) {
        filter.tgId = Number(q);
      } else {
        const rx = new RegExp(escapeRegex(q.replace(/^@/, "")), "i");
        filter.$or = [{ firstName: rx }, { lastName: rx }, { username: rx }];
      }
    }
    if (req.query.banned === "1") filter.isBanned = true;

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE)
        .limit(PAGE)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      page,
      total,
      hasMore: page * PAGE < total,
      items: items.map((u) => ({
        ...userBrief(u),
        balance: u.balance,
        level: u.level,
        tasksApproved: u.tasksApproved,
        referralCount: u.referralCount,
        isBanned: u.isBanned,
        createdAt: u.createdAt,
        lastSeenAt: u.lastSeenAt,
      })),
    });
  })
);

router.get(
  "/users/:tgId",
  wrap(async (req, res) => {
    const tgId = Number(req.params.tgId);
    if (!Number.isInteger(tgId)) throw fail(404, "User not found");
    const u = await User.findOne({ tgId }).lean();
    if (!u) throw fail(404, "User not found");

    const [txs, wdCount, rewarded] = await Promise.all([
      Transaction.find({ tgId }).sort({ createdAt: -1 }).limit(20).lean(),
      Payment.countDocuments({ tgId, type: "withdraw", status: "success" }),
      User.countDocuments({ referredBy: tgId, referralRewarded: true }),
    ]);

    res.json({
      user: {
        ...userBrief(u),
        balance: u.balance,
        totalEarned: u.totalEarned,
        totalDeposited: u.totalDeposited,
        totalWithdrawn: u.totalWithdrawn,
        referralEarnings: u.referralEarnings,
        level: u.level,
        tasksApproved: u.tasksApproved,
        referralCount: u.referralCount,
        referralsRewarded: rewarded,
        referredBy: u.referredBy,
        withdrawDetails: u.withdrawDetails,
        language: u.language,
        isBanned: u.isBanned,
        banReason: u.banReason,
        botBlocked: u.botBlocked,
        createdAt: u.createdAt,
        lastSeenAt: u.lastSeenAt,
        successfulWithdrawals: wdCount,
      },
      transactions: txs.map((t) => ({
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

router.post(
  "/users/:tgId/ban",
  wrap(async (req, res) => {
    const tgId = Number(req.params.tgId);
    if (!Number.isInteger(tgId)) throw fail(404, "User not found");
    const banned = bool(req.body && req.body.banned);
    const reason = str(req.body && req.body.reason, "Reason", 200);

    if (banned && (await isAdmin(tgId))) throw fail(400, "You cannot ban an admin");

    const u = await User.findOneAndUpdate(
      { tgId },
      { $set: { isBanned: banned, banReason: banned ? reason : "" } },
      { new: true }
    );
    if (!u) throw fail(404, "User not found");
    res.json({ ok: true, isBanned: u.isBanned });
  })
);

router.post(
  "/users/:tgId/balance",
  wrap(async (req, res) => {
    const tgId = Number(req.params.tgId);
    if (!Number.isInteger(tgId)) throw fail(404, "User not found");
    const amount = round2(num(req.body && req.body.amount, "Amount", { min: -1000000, max: 1000000 }));
    if (amount === 0) throw fail(400, "Amount cannot be zero");
    const note = str(req.body && req.body.note, "Note", 120);

    const user = await User.findOne({ tgId });
    if (!user) throw fail(404, "User not found");

    const label = `Admin adjustment${note ? ": " + note : ""}`;
    let updated;
    if (amount > 0) {
      updated = await wallet.credit(user._id, amount, "admin_adjust", label, String(req.user.tgId));
    } else {
      updated = await wallet.debit(user._id, -amount, "admin_adjust", label, String(req.user.tgId));
      if (!updated) throw fail(400, "User balance is lower than this amount");
    }

    const sign = amount > 0 ? "+" : "-";
    bot.notifyUser(
      updated,
      `Your balance was adjusted by ${sign}₹${Math.abs(amount)}.${note ? "\nNote: " + escapeHtml(note) : ""}`,
      `আপনার ব্যালেন্স ${sign}₹${Math.abs(amount)} সমন্বয় করা হয়েছে।${note ? "\nনোট: " + escapeHtml(note) : ""}`
    );
    res.json({ ok: true, balance: updated.balance });
  })
);

/* ------------------------------ TASKS ------------------------------ */

function taskFields(b, settings, partial) {
  const out = {};
  const has = (k) => b[k] !== undefined;

  if (!partial || has("title")) {
    const t = b.title || {};
    out["title.en"] = str(t.en, "Title (English)", 120, { required: true });
    out["title.bn"] = str(t.bn, "Title (Bangla)", 120);
  }
  if (!partial || has("description")) {
    const d = b.description || {};
    out["description.en"] = str(d.en, "Description (English)", 2000);
    out["description.bn"] = str(d.bn, "Description (Bangla)", 2000);
  }
  if (!partial || has("category")) {
    const c = str(b.category || "other", "Category", 40);
    const ok = (settings.categories || []).some((x) => x.id === c);
    if (!ok) throw fail(400, "Unknown category");
    out.category = c;
  }
  if (!partial || has("reward")) {
    out.reward = round2(num(b.reward, "Reward", { min: 0, max: 100000 }));
  }
  if (!partial || has("link")) out.link = urlOrEmpty(b.link, "Task link");
  if (!partial || has("proofRequired")) out.proofRequired = b.proofRequired === undefined ? true : bool(b.proofRequired);
  if (!partial || has("limitPerUser")) {
    out.limitPerUser = num(b.limitPerUser === undefined ? 1 : b.limitPerUser, "Limit per user", { min: 1, max: 1000, int: true });
  }
  if (!partial || has("totalLimit")) {
    out.totalLimit = num(b.totalLimit === undefined || b.totalLimit === "" ? 0 : b.totalLimit, "Total limit", { min: 0, max: 10000000, int: true });
  }
  if (!partial || has("expiresAt")) {
    if (b.expiresAt === "" || b.expiresAt === null || b.expiresAt === undefined) {
      out.expiresAt = null;
    } else {
      const d = new Date(b.expiresAt);
      if (Number.isNaN(d.getTime())) throw fail(400, "Invalid expiry date");
      out.expiresAt = d;
    }
  }
  if (!partial || has("active")) out.active = b.active === undefined ? true : bool(b.active);
  if (!partial || has("sortOrder")) {
    out.sortOrder = num(b.sortOrder === undefined || b.sortOrder === "" ? 0 : b.sortOrder, "Sort order", { min: -100000, max: 100000, int: true });
  }
  return out;
}

router.get(
  "/tasks",
  wrap(async (req, res) => {
    const [tasks, pend] = await Promise.all([
      Task.find().sort({ createdAt: -1 }).limit(300).lean(),
      Submission.aggregate([
        { $match: { status: "pending" } },
        { $group: { _id: "$task", n: { $sum: 1 } } },
      ]),
    ]);
    const pm = {};
    pend.forEach((p) => (pm[String(p._id)] = p.n));
    res.json({
      items: tasks.map((t) => ({
        id: t._id,
        title: t.title,
        description: t.description,
        category: t.category,
        reward: t.reward,
        link: t.link,
        proofRequired: t.proofRequired,
        limitPerUser: t.limitPerUser,
        totalLimit: t.totalLimit,
        filled: t.filled,
        expiresAt: t.expiresAt,
        active: t.active,
        sortOrder: t.sortOrder,
        pending: pm[String(t._id)] || 0,
        createdAt: t.createdAt,
      })),
    });
  })
);

router.post(
  "/tasks",
  wrap(async (req, res) => {
    const fields = taskFields(req.body || {}, req.settings, false);
    const task = new Task();
    task.set(fields);
    await task.save();
    res.json({ ok: true, id: task._id });
  })
);

router.put(
  "/tasks/:id",
  wrap(async (req, res) => {
    oid(req.params.id, "Task not found");
    const fields = taskFields(req.body || {}, req.settings, true);
    if (!Object.keys(fields).length) throw fail(400, "Nothing to update");
    const t = await Task.findByIdAndUpdate(req.params.id, { $set: fields }, { new: true });
    if (!t) throw fail(404, "Task not found");
    res.json({ ok: true });
  })
);

router.delete(
  "/tasks/:id",
  wrap(async (req, res) => {
    oid(req.params.id, "Task not found");
    const used = await Submission.exists({ task: req.params.id });
    if (used) {
      await Task.updateOne({ _id: req.params.id }, { $set: { active: false } });
      return res.json({ ok: true, deactivated: true });
    }
    await Task.deleteOne({ _id: req.params.id });
    res.json({ ok: true, deleted: true });
  })
);

/* ------------------------------ PROOF REVIEW ------------------------------ */

router.get(
  "/submissions",
  wrap(async (req, res) => {
    const page = pageOf(req);
    const status = ["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : "pending";
    const filter = { status };
    if (req.query.task && mongoose.isValidObjectId(req.query.task)) filter.task = req.query.task;

    const subs = await Submission.find(filter)
      .sort({ createdAt: status === "pending" ? 1 : -1 })
      .skip((page - 1) * PAGE)
      .limit(PAGE)
      .lean();

    const [um, tasks] = await Promise.all([
      userMap(subs.map((s) => s.tgId)),
      Task.find({ _id: { $in: subs.map((s) => s.task) } }).select("title").lean(),
    ]);
    const tm = {};
    tasks.forEach((t) => (tm[String(t._id)] = t));

    res.json({
      page,
      hasMore: subs.length === PAGE,
      items: subs.map((s) => {
        const u = um[s.tgId];
        const t = tm[String(s.task)];
        return {
          id: s._id,
          status: s.status,
          reward: s.reward,
          hasProof: !!s.proofFileId,
          rejectReason: s.rejectReason,
          createdAt: s.createdAt,
          reviewedAt: s.reviewedAt,
          user: u ? userBrief(u) : { tgId: s.tgId, name: "Unknown", username: "" },
          task: { id: s.task, title: t ? t.title : { en: "Deleted task", bn: "" } },
        };
      }),
    });
  })
);

// Streams the screenshot from the private Telegram channel (admins only).
router.get(
  "/submissions/:id/proof",
  wrap(async (req, res) => {
    oid(req.params.id, "Proof not found");
    const sub = await Submission.findById(req.params.id).select("proofFileId").lean();
    if (!sub || !sub.proofFileId) throw fail(404, "No proof image");
    const f = await bot.downloadFile(sub.proofFileId);
    res.set("Content-Type", f.contentType);
    res.set("Cache-Control", "private, max-age=300");
    res.send(f.buffer);
  })
);

router.post(
  "/submissions/:id/approve",
  wrap(async (req, res) => {
    oid(req.params.id, "Submission not found");
    const sub = await wallet.approveSubmission(req.params.id, req.user.tgId);
    if (!sub) throw fail(400, "Already reviewed or not found");
    res.json({ ok: true });
  })
);

router.post(
  "/submissions/:id/reject",
  wrap(async (req, res) => {
    oid(req.params.id, "Submission not found");
    const reason = str(req.body && req.body.reason, "Reason", 300, { required: true });
    const sub = await wallet.rejectSubmission(req.params.id, req.user.tgId, reason);
    if (!sub) throw fail(400, "Already reviewed or not found");
    res.json({ ok: true });
  })
);

/* ------------------------------ PAYMENTS ------------------------------ */

router.get(
  "/payments",
  wrap(async (req, res) => {
    const page = pageOf(req);
    const filter = {};
    if (["deposit", "withdraw"].includes(req.query.type)) filter.type = req.query.type;
    if (req.query.status) filter.status = String(req.query.status);
    const q = String(req.query.q || "").trim();
    if (/^\d+$/.test(q)) filter.tgId = Number(q);

    const items = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE)
      .limit(PAGE)
      .lean();
    const um = await userMap(items.map((p) => p.tgId));

    res.json({
      page,
      hasMore: items.length === PAGE,
      items: items.map((p) => {
        const u = um[p.tgId];
        return {
          id: p._id,
          orderId: p.orderId,
          type: p.type,
          method: p.method,
          amount: p.amount,
          fee: p.fee,
          netAmount: p.netAmount,
          status: p.status,
          destination: p.destination,
          failureReason: p.failureReason,
          createdAt: p.createdAt,
          user: u ? userBrief(u) : { tgId: p.tgId, name: "Unknown", username: "" },
        };
      }),
    });
  })
);

router.post(
  "/payments/:id/approve",
  wrap(async (req, res) => {
    oid(req.params.id, "Request not found");
    const p = await payments.approveWithdraw(req.params.id, req.user.tgId);
    if (!p) throw fail(400, "Request not found or already handled");
    res.json({ ok: true, status: p.status });
  })
);

router.post(
  "/payments/:id/reject",
  wrap(async (req, res) => {
    oid(req.params.id, "Request not found");
    const reason = str(req.body && req.body.reason, "Reason", 200) || "Rejected by admin";
    const p = await payments.rejectWithdraw(req.params.id, reason);
    if (!p) throw fail(400, "Request not found or already handled");
    res.json({ ok: true });
  })
);

/* ------------------------------ BROADCAST ------------------------------ */

// Progress lives in memory (resets if the server restarts).
const job = {
  running: false,
  total: 0,
  sent: 0,
  failed: 0,
  blocked: 0,
  startedAt: null,
  finishedAt: null,
};

function audienceFilter(segment, level) {
  const f = { isBanned: false, botBlocked: false, notifications: { $ne: false } };
  const week = new Date(Date.now() - 7 * 86400000);
  switch (segment) {
    case "all":
      break;
    case "active7":
      f.lastSeenAt = { $gte: week };
      break;
    case "inactive7":
      f.$or = [{ lastSeenAt: null }, { lastSeenAt: { $lt: week } }];
      break;
    case "new7":
      f.createdAt = { $gte: week };
      break;
    case "depositors":
      f.totalDeposited = { $gt: 0 };
      break;
    case "nondepositors":
      f.totalDeposited = 0;
      break;
    case "level":
      f.level = num(level, "Level", { min: 1, max: 50, int: true });
      break;
    case "lang_en":
      f.language = "en";
      break;
    case "lang_bn":
      f.language = "bn";
      break;
    default:
      throw fail(400, "Unknown audience");
  }
  return f;
}

function parseBroadcast(b) {
  b = b || {};
  const en = str(b.textEn, "English text", 3500);
  const bn = str(b.textBn, "Bangla text", 3500);
  if (!en && !bn) throw fail(400, "Write a message in English or Bangla");

  let button = null;
  const buttonText = str(b.buttonText, "Button text", 40);
  if (buttonText) {
    const url = urlOrEmpty(b.buttonUrl, "Button link");
    button = url ? { text: buttonText, url } : bot.openAppButton(buttonText);
  }
  return {
    filter: audienceFilter(String(b.segment || ""), b.level),
    en: en ? escapeHtml(en) : "",
    bn: bn ? escapeHtml(bn) : "",
    button,
  };
}

async function runBroadcast(filter, en, bn, button) {
  try {
    const cursor = User.find(filter).select("tgId language").lean().cursor();
    for await (const u of cursor) {
      const text = u.language === "bn" ? bn || en : en || bn;
      let done = false;
      for (let attempt = 0; attempt < 2 && !done; attempt++) {
        try {
          await bot.sendMessage(u.tgId, text, button ? [button] : undefined);
          job.sent++;
          done = true;
        } catch (e) {
          if (e.retryAfter && attempt === 0) {
            await sleep((e.retryAfter + 1) * 1000);
            continue;
          }
          if (e.code === 403) {
            job.blocked++;
            User.updateOne({ tgId: u.tgId }, { $set: { botBlocked: true } }).catch(() => {});
          } else {
            job.failed++;
          }
          done = true;
        }
      }
      await sleep(50); // about 20 messages per second
    }
  } catch (e) {
    console.error("Broadcast error:", e.message);
  } finally {
    job.running = false;
    job.finishedAt = new Date();
  }
}

router.post(
  "/broadcast/preview",
  wrap(async (req, res) => {
    const b = req.body || {};
    const filter = audienceFilter(String(b.segment || ""), b.level);
    res.json({ count: await User.countDocuments(filter) });
  })
);

router.post(
  "/broadcast/test",
  wrap(async (req, res) => {
    const { en, bn, button } = parseBroadcast({ ...(req.body || {}), segment: "all" });
    const text = req.user.language === "bn" ? bn || en : en || bn;
    try {
      await bot.sendMessage(req.user.tgId, text, button ? [button] : undefined);
    } catch (e) {
      throw fail(400, "Could not send the test. Open the bot chat and press Start first.");
    }
    res.json({ ok: true });
  })
);

router.post(
  "/broadcast",
  wrap(async (req, res) => {
    if (job.running) throw fail(409, "A broadcast is already running");
    const { filter, en, bn, button } = parseBroadcast(req.body);
    const total = await User.countDocuments(filter);
    if (!total) throw fail(400, "No users in this audience");

    Object.assign(job, {
      running: true,
      total,
      sent: 0,
      failed: 0,
      blocked: 0,
      startedAt: new Date(),
      finishedAt: null,
    });
    runBroadcast(filter, en, bn, button);
    res.json({ ok: true, total });
  })
);

router.get("/broadcast/status", (req, res) => {
  res.json({ ...job });
});

/* ------------------------------ SETTINGS ------------------------------ */

router.get(
  "/settings",
  wrap(async (req, res) => {
    const s = await getSettings(true);
    const { _id, __v, key, createdAt, updatedAt, ...rest } = s;
    res.json({ settings: rest, envAdmins: envAdminIds() });
  })
);

function buildSettingsUpdate(b) {
  const set = {};
  const has = (o, k) => o && typeof o === "object" && o[k] !== undefined;

  if (b.app && typeof b.app === "object") {
    const a = b.app;
    if (has(a, "name")) set["app.name"] = str(a.name, "App name", 40, { required: true });
    if (has(a, "botUsername")) {
      const u = str(a.botUsername, "Bot username", 64).replace(/^@/, "");
      if (u && !/^[A-Za-z0-9_]{3,64}$/.test(u)) throw fail(400, "Invalid bot username");
      set["app.botUsername"] = u;
    }
    if (has(a, "appShortName")) {
      const u = str(a.appShortName, "Mini App short name", 64);
      if (u && !/^[A-Za-z0-9_]{3,64}$/.test(u)) throw fail(400, "Invalid Mini App short name");
      set["app.appShortName"] = u;
    }
    if (has(a, "supportLink")) set["app.supportLink"] = urlOrEmpty(a.supportLink, "Support link");
    if (has(a, "channelLink")) set["app.channelLink"] = urlOrEmpty(a.channelLink, "Channel link");
    if (has(a, "timezone")) {
      const tz = str(a.timezone, "Timezone", 60, { required: true });
      if (!validTz(tz)) throw fail(400, "Invalid timezone (example: Asia/Kolkata)");
      set["app.timezone"] = tz;
    }
    if (has(a, "maintenance")) set["app.maintenance"] = bool(a.maintenance);
    if (has(a, "maintenanceMessage")) {
      set["app.maintenanceMessage"] = str(a.maintenanceMessage, "Maintenance message", 300);
    }
  }

  if (has(b, "bonus") && has(b.bonus, "welcome")) {
    set["bonus.welcome"] = round2(num(b.bonus.welcome, "Welcome bonus", { min: 0, max: 10000 }));
  }

  if (b.deposit && typeof b.deposit === "object") {
    const d = b.deposit;
    if (has(d, "enabled")) set["deposit.enabled"] = bool(d.enabled);
    if (has(d, "min")) set["deposit.min"] = num(d.min, "Minimum deposit", { min: 1, max: 1000000 });
    if (has(d, "max")) set["deposit.max"] = num(d.max, "Maximum deposit", { min: 1, max: 10000000 });
    if (has(d, "feePercent")) set["deposit.feePercent"] = num(d.feePercent, "Deposit fee %", { min: 0, max: 50 });
    if (has(d, "min") && has(d, "max") && Number(d.min) > Number(d.max)) {
      throw fail(400, "Minimum deposit cannot be above maximum");
    }
  }

  if (b.withdraw && typeof b.withdraw === "object") {
    const w = b.withdraw;
    if (has(w, "enabled")) set["withdraw.enabled"] = bool(w.enabled);
    if (has(w, "autoPayout")) set["withdraw.autoPayout"] = bool(w.autoPayout);
    if (has(w, "approvalEnabled")) set["withdraw.approvalEnabled"] = bool(w.approvalEnabled);
    if (has(w, "approvalAbove")) {
      set["withdraw.approvalAbove"] = num(w.approvalAbove, "Approval amount", { min: 0, max: 100000000 });
    }
    // UPI and FINZO Wallet limits are saved separately
    for (const m of ["upi", "wallet"]) {
      const x = w[m];
      if (!x || typeof x !== "object") continue;
      const label = m === "upi" ? "UPI" : "Wallet";
      if (has(x, "enabled")) set[`withdraw.${m}.enabled`] = bool(x.enabled);
      if (has(x, "min")) set[`withdraw.${m}.min`] = num(x.min, `${label} minimum`, { min: 1, max: 1000000 });
      if (has(x, "max")) set[`withdraw.${m}.max`] = num(x.max, `${label} maximum`, { min: 1, max: 10000000 });
      if (has(x, "dailyLimit")) {
        set[`withdraw.${m}.dailyLimit`] = num(x.dailyLimit, `${label} daily limit`, { min: 1, max: 100000000 });
      }
      if (has(x, "min") && has(x, "max") && Number(x.min) > Number(x.max)) {
        throw fail(400, `${label} minimum cannot be above maximum`);
      }
    }
  }

  if (b.referral && typeof b.referral === "object") {
    const r = b.referral;
    if (has(r, "enabled")) set["referral.enabled"] = bool(r.enabled);
    if (has(r, "reward")) set["referral.reward"] = round2(num(r.reward, "Referral reward", { min: 0, max: 100000 }));
    if (has(r, "payOn")) {
      if (!["first_task", "join"].includes(r.payOn)) throw fail(400, "Invalid referral payout rule");
      set["referral.payOn"] = r.payOn;
    }
  }

  if (b.checkin && typeof b.checkin === "object") {
    const c = b.checkin;
    if (has(c, "enabled")) set["checkin.enabled"] = bool(c.enabled);
    if (has(c, "rewards")) {
      if (!Array.isArray(c.rewards) || c.rewards.length < 1 || c.rewards.length > 31) {
        throw fail(400, "Check-in rewards need 1 to 31 values");
      }
      set["checkin.rewards"] = c.rewards.map((v, i) => round2(num(v, `Check-in day ${i + 1}`, { min: 0, max: 1000 })));
    }
  }

  if (has(b, "proof") && has(b.proof, "maxSizeMB")) {
    set["proof.maxSizeMB"] = num(b.proof.maxSizeMB, "Proof size (MB)", { min: 1, max: 10 });
  }

  if (b.club && typeof b.club === "object") {
    if (has(b.club, "enabled")) set["club.enabled"] = bool(b.club.enabled);
    if (has(b.club, "showLimit")) {
      set["club.showLimit"] = num(b.club.showLimit, "Club feed size", { min: 5, max: 100, int: true });
    }
  }

  if (Array.isArray(b.admins)) {
    if (b.admins.length > 20) throw fail(400, "Too many extra admins (max 20)");
    set.admins = [...new Set(b.admins.map((v) => num(v, "Admin ID", { min: 1, max: 99999999999999, int: true })))];
  }

  if (Array.isArray(b.levels)) {
    if (b.levels.length < 1 || b.levels.length > 15) throw fail(400, "Levels must be between 1 and 15");
    set.levels = b.levels.map((L, i) => {
      L = L || {};
      const n = i + 1;
      return {
        name: str(L.name, `Level ${n} name`, 30, { required: true }),
        minTasks: i === 0 ? 0 : num(L.minTasks, `Level ${n} tasks`, { min: 0, max: 1000000, int: true }),
        minReferrals: i === 0 ? 0 : num(L.minReferrals, `Level ${n} referrals`, { min: 0, max: 1000000, int: true }),
        withdrawFeePercent: num(L.withdrawFeePercent, `Level ${n} fee %`, { min: 0, max: 100 }),
        monthlyWithdrawals: num(L.monthlyWithdrawals, `Level ${n} withdrawals per month`, { min: 1, max: 100, int: true }),
      };
    });
  }

  if (Array.isArray(b.categories)) {
    if (b.categories.length < 1 || b.categories.length > 20) throw fail(400, "Categories must be between 1 and 20");
    const seen = new Set();
    set.categories = b.categories.map((c) => {
      c = c || {};
      const id = str(c.id, "Category ID", 20, { required: true }).toLowerCase();
      if (!/^[a-z0-9_-]{1,20}$/.test(id)) throw fail(400, "Category ID: use only a-z, 0-9, - and _");
      if (seen.has(id)) throw fail(400, `Duplicate category ID: ${id}`);
      seen.add(id);
      return {
        id,
        en: str(c.en, "Category name", 30, { required: true }),
        icon: str(c.icon || "grid", "Category icon", 20),
      };
    });
  }

  if (Array.isArray(b.faq)) {
    if (b.faq.length > 30) throw fail(400, "Too many FAQ items (max 30)");
    set.faq = b.faq.map((f) => {
      f = f || {};
      return {
        qEn: str(f.qEn, "FAQ question", 200, { required: true }),
        qBn: str(f.qBn, "FAQ question (Bangla)", 200),
        aEn: str(f.aEn, "FAQ answer", 1000, { required: true }),
        aBn: str(f.aBn, "FAQ answer (Bangla)", 1000),
      };
    });
  }

  return set;
}

router.put(
  "/settings",
  wrap(async (req, res) => {
    const set = buildSettingsUpdate(req.body || {});
    if (!Object.keys(set).length) throw fail(400, "Nothing to update");
    await Setting.updateOne({ key: "main" }, { $set: set });
    clearSettingsCache();
    const s = await getSettings(true);
    const { _id, __v, key, createdAt, updatedAt, ...rest } = s;
    res.json({ ok: true, settings: rest, envAdmins: envAdminIds() });
  })
);

module.exports = router;
