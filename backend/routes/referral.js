const express = require("express");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { authenticate } = require("../middleware/auth");
const { wrap } = require("../utils/helpers");
const { referralLink } = require("../utils/links");

const router = express.Router();
router.use(authenticate);

router.get(
  "/",
  wrap(async (req, res) => {
    const { user, settings } = req;

    const sums = await Transaction.aggregate([
      { $match: { tgId: user.tgId, type: { $in: ["referral_l1", "referral_l2"] } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);
    const earned = { l1: 0, l2: 0 };
    sums.forEach((s) => {
      if (s._id === "referral_l1") earned.l1 = s.total;
      if (s._id === "referral_l2") earned.l2 = s.total;
    });

    const direct = await User.find({ referredBy: user.tgId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("firstName tasksApproved createdAt hideName")
      .lean();

    res.json({
      enabled: settings.referral.enabled,
      code: String(user.tgId),
      link: referralLink(settings, user.tgId),
      percent: { l1: settings.referral.l1Percent, l2: settings.referral.l2Percent },
      counts: { l1: user.referralCount, l2: user.referralCount2 },
      earned,
      total: user.referralEarnings,
      referrals: direct.map((r) => ({
        name: r.hideName ? "Hidden user" : r.firstName || "User",
        tasks: r.tasksApproved,
        joinedAt: r.createdAt,
      })),
    });
  })
);

module.exports = router;
