const express = require("express");
const Payment = require("../models/Payment");
const finzo = require("../services/finzo");
const payments = require("../services/payments");
const { wrap } = require("../utils/helpers");

const router = express.Router();

router.all(
  "/finzo/callback",
  wrap(async (req, res) => {
    const body = req.body && Object.keys(req.body).length ? req.body : req.query;

    if (!finzo.verifyCallback(body)) {
      return res.status(401).send("invalid signature");
    }

    const orderId = String(finzo.pick(body, "order_id", "orderId", "merchant_order_id") || "");
    const status = finzo.normalize(finzo.pick(body, "status", "payment_status", "txn_status"));
    const amount = finzo.pick(body, "amount");
    const ref = String(finzo.pick(body, "transaction_id", "txn_id", "id") || "");

    const payment = orderId ? await Payment.findOne({ orderId }) : null;
    if (!payment) return res.status(404).send("order not found");

    if (payment.type === "deposit") {
      await payments.settleDeposit(orderId, status, { ref, amount, raw: body });
    } else if (status === "success") {
      await payments.finalizeWithdraw(payment);
    } else if (status === "failed") {
      await payments.refundWithdraw(payment, "Payout failed", "failed", ["processing"]);
    }

    res.status(200).send("OK");
  })
);

module.exports = router;
