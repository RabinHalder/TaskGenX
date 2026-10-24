const express = require("express");
const Payment = require("../models/Payment");
const { authenticate } = require("../middleware/auth");
const payments = require("../services/payments");
const { wrap } = require("../utils/helpers");
const { fail } = require("../utils/errors");

const router = express.Router();
router.use(authenticate);

function view(p) {
  return {
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
  };
}

router.post(
  "/deposit",
  wrap(async (req, res) => {
    const amount = Number(req.body && req.body.amount);
    if (!Number.isFinite(amount)) throw fail(400, "Enter a valid amount");
    const p = await payments.createDeposit(req.user, amount, req.settings);
    res.json({ ...view(p), paymentUrl: p.paymentUrl });
  })
);

router.get(
  "/deposit/:orderId",
  wrap(async (req, res) => {
    let p = await Payment.findOne({
      orderId: req.params.orderId,
      tgId: req.user.tgId,
      type: "deposit",
    });
    if (!p) throw fail(404, "Payment not found");
    if (p.status === "pending" && !p.settled) {
      try {
        await payments.checkDeposit(p);
        p = await Payment.findById(p._id);
      } catch (e) {
        /* the background job will retry */
      }
    }
    res.json(view(p));
  })
);

router.post(
  "/withdraw",
  wrap(async (req, res) => {
    const b = req.body || {};
    const amount = Number(b.amount);
    if (!Number.isFinite(amount)) throw fail(400, "Enter a valid amount");
    let p = await payments.createWithdraw(req.user, amount, String(b.method || ""), req.settings);
    // If the payout already finished (success/failed) inside createWithdraw, fetch the latest row
    // so the response carries the final status and failureReason instead of the initial "created".
    if (p && ["created", "processing"].includes(p.status)) {
      const fresh = await Payment.findById(p._id);
      if (fresh) p = fresh;
    }
    res.json(view(p));
  })
);

router.post(
  "/withdraw/:orderId/cancel",
  wrap(async (req, res) => {
    const p = await Payment.findOne({
      orderId: req.params.orderId,
      tgId: req.user.tgId,
      type: "withdraw",
    });
    if (!p) throw fail(404, "Request not found");
    const done = await payments.cancelWithdraw(p);
    if (!done) throw fail(400, "This request can no longer be cancelled");
    res.json({ ok: true });
  })
);

router.get(
  "/payments",
  wrap(async (req, res) => {
    const filter = { tgId: req.user.tgId };
    if (["deposit", "withdraw"].includes(req.query.type)) filter.type = req.query.type;
    const items = await Payment.find(filter).sort({ createdAt: -1 }).limit(40).lean();
    res.json({ items: items.map(view) });
  })
);

module.exports = router;
