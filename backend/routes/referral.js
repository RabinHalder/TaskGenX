const express = require("express");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const { wrap } = require("../utils/helpers");
const { referralLink } = require("../utils/links");

const router = express.Router();
router.use(authenticate);

// Single-level referral with a fixed reward per referral
router.get(
  "/",
  wrap(async (req, res) => {
    const { user, settings } = req;

    const [rewarded, direct] = await Promise.all([
      User.countDocuments({ referredBy: user.tgId, referralRewarded: true }),
      User.find({ referredBy: user.tgId })
        .sort({ createdAt: -1 })
        .limit(50)
        .select("firstName tasksApproved createdAt hideName referralRewarded")
        .lean(),
    ]);

    res.json({
      enabled: settings.referral.enabled,
      code: String(user.tgId),
      link: referralLink(settings, user.tgId),
      reward: settings.referral.reward,
      payOn: settings.referral.payOn,
      counts: { joined: user.referralCount, rewarded },
      total: user.referralEarnings,
      referrals: direct.map((r) => ({
        name: r.hideName ? "Hidden user" : r.firstName || "User",
        tasks: r.tasksApproved,
        joinedAt: r.createdAt,
        rewarded: !!r.referralRewarded,
      })),
    });
  })
);

module.exports = router;
