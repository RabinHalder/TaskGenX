const express = require("express");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const { fullName, maskId, maskDestination, wrap } = require("../utils/helpers");

const router = express.Router();
router.use(authenticate);

// Live feed of successful deposits and withdrawals
router.get(
  "/feed",
  wrap(async (req, res) => {
    const { settings } = req;
    if (!settings.club.enabled) return res.json({ enabled: false, items: [] });

    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || settings.club.showLimit, 1),
      settings.club.showLimit
    );
    const payments = await Payment.find({ status: "success" })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const users = await User.find({ tgId: { $in: payments.map((p) => p.tgId) } })
      .select("tgId firstName lastName username hideName")
      .lean();
    const umap = {};
    users.forEach((u) => (umap[u.tgId] = u));

    const items = payments.map((p) => {
      const u = umap[p.tgId];
      const hidden = !u || u.hideName;
      return {
        id: p._id,
        type: p.type,
        name: hidden ? null : fullName(u), // null = frontend shows "Hidden user"
        maskedId: maskId(p.tgId),
        maskedDestination: p.type === "withdraw" ? maskDestination(p.destination) : "",
        amount: p.type === "withdraw" ? p.netAmount : p.amount,
        at: p.updatedAt,
      };
    });
    res.json({ enabled: true, items });
  })
);

module.exports = router;
