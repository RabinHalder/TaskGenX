const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Submission = require("../models/Submission");
const { authenticate } = require("../middleware/auth");
const bot = require("../services/telegramBot");
const { wrap, fullName } = require("../utils/helpers");
const { fail } = require("../utils/errors");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single("proof");

function receiveUpload(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image is too large" : "Upload failed";
    res.status(400).json({ error: "upload_error", message });
  });
}

function taskView(t, mine, withLink) {
  const m = mine[String(t._id)] || { pending: 0, approved: 0 };
  const used = m.pending + m.approved;
  const full = t.totalLimit > 0 && t.filled >= t.totalLimit;
  const view = {
    id: t._id,
    title: t.title,
    description: t.description,
    category: t.category,
    reward: t.reward,
    proofRequired: t.proofRequired,
    limitPerUser: t.limitPerUser,
    myPending: m.pending,
    myApproved: m.approved,
    completed: used >= t.limitPerUser,
    full,
    remaining: t.totalLimit > 0 ? Math.max(0, t.totalLimit - t.filled) : null,
    expiresAt: t.expiresAt,
  };
  if (withLink) view.link = t.link;
  return view;
}

async function myCounts(tgId) {
  const rows = await Submission.aggregate([
    { $match: { tgId, status: { $in: ["pending", "approved"] } } },
    { $group: { _id: { task: "$task", status: "$status" }, n: { $sum: 1 } } },
  ]);
  const map = {};
  for (const r of rows) {
    const k = String(r._id.task);
    map[k] = map[k] || { pending: 0, approved: 0 };
    map[k][r._id.status] = r.n;
  }
  return map;
}

function activeFilter() {
  return {
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };
}

router.get(
  "/",
  authenticate,
  wrap(async (req, res) => {
    const filter = activeFilter();
    if (req.query.category) filter.category = String(req.query.category);
    const [tasks, mine] = await Promise.all([
      Task.find(filter).sort({ sortOrder: -1, createdAt: -1 }).limit(200).lean(),
      myCounts(req.user.tgId),
    ]);
    res.json({ items: tasks.map((t) => taskView(t, mine, false)) });
  })
);

// Submission history with rejection reasons
router.get(
  "/my/history",
  authenticate,
  wrap(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const filter = { tgId: req.user.tgId };
    if (["pending", "approved", "rejected"].includes(req.query.status)) filter.status = req.query.status;

    const subs = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const tasks = await Task.find({ _id: { $in: subs.map((s) => s.task) } })
      .select("title category")
      .lean();
    const tmap = {};
    tasks.forEach((t) => (tmap[String(t._id)] = t));

    res.json({
      page,
      hasMore: subs.length === limit,
      items: subs.map((s) => {
        const t = tmap[String(s.task)];
        return {
          id: s._id,
          taskId: s.task,
          title: t ? t.title : { en: "Deleted task", bn: "মুছে ফেলা টাস্ক" },
          reward: s.reward,
          status: s.status,
          rejectReason: s.rejectReason,
          createdAt: s.createdAt,
          reviewedAt: s.reviewedAt,
        };
      }),
    });
  })
);

router.get(
  "/:id",
  authenticate,
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(404, "Task not found");
    const t = await Task.findById(req.params.id).lean();
    if (!t || !t.active) throw fail(404, "Task not found");
    const mine = await myCounts(req.user.tgId);
    res.json({ task: taskView(t, mine, true) });
  })
);

router.post(
  "/:id/submit",
  authenticate,
  receiveUpload,
  wrap(async (req, res) => {
    const { user, settings } = req;
    if (!mongoose.isValidObjectId(req.params.id)) throw fail(404, "Task not found");

    const task = await Task.findById(req.params.id);
    const now = new Date();
    if (!task || !task.active) throw fail(404, "Task not found");
    if (task.expiresAt && task.expiresAt <= now) throw fail(400, "This task has expired");

    const mine = await Submission.countDocuments({
      user: user._id,
      task: task._id,
      status: { $in: ["pending", "approved"] },
    });
    if (mine >= task.limitPerUser) throw fail(400, "You have reached the limit for this task");

    let proof = null;
    if (task.proofRequired) {
      const f = req.file;
      if (!f) throw fail(400, "Please upload a screenshot as proof");
      const maxMB = settings.proof.maxSizeMB;
      if (f.size > maxMB * 1024 * 1024) throw fail(413, `Image is too large (max ${maxMB} MB)`);

      const b = f.buffer;
      const isJpg = b[0] === 0xff && b[1] === 0xd8;
      const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
      if (!isJpg && !isPng) throw fail(400, "Only JPG or PNG images are allowed");

      const hash = crypto.createHash("sha256").update(b).digest("hex");
      if (await Submission.exists({ proofHash: hash })) {
        throw fail(409, "This screenshot has already been used");
      }
      proof = { hash, buffer: b, mime: isPng ? "image/png" : "image/jpeg" };
    }

    // Reserve a slot atomically (respects total limit and expiry)
    const reserved = await Task.findOneAndUpdate(
      {
        _id: task._id,
        active: true,
        $and: [
          { $or: [{ totalLimit: 0 }, { $expr: { $lt: ["$filled", "$totalLimit"] } }] },
          { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        ],
      },
      { $inc: { filled: 1 } },
      { new: true }
    );
    if (!reserved) throw fail(400, "This task is full or no longer available");

    try {
      const doc = { user: user._id, tgId: user.tgId, task: task._id, reward: task.reward };
      if (proof) {
        const up = await bot.uploadProof(
          proof.buffer,
          proof.mime,
          `Task: ${task.title.en}\nUser: ${fullName(user)} (${user.tgId})\nReward: ₹${task.reward}`
        );
        doc.proofHash = proof.hash;
        doc.proofFileId = up.fileId;
        doc.proofFileUniqueId = up.fileUniqueId;
        doc.proofMessageId = up.messageId;
      }
      const sub = await Submission.create(doc);
      res.json({ ok: true, id: sub._id, status: "pending" });
    } catch (e) {
      await Task.updateOne({ _id: task._id, filled: { $gt: 0 } }, { $inc: { filled: -1 } });
      if (e.code === 11000) throw fail(409, "This screenshot has already been used");
      if (e.status) throw e;
      console.error("Submit failed:", e.message);
      throw fail(502, "Could not save your proof. Please try again.");
    }
  })
);

module.exports = router;
