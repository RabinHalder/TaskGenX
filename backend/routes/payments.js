const express = require("express");
const Payment = require("../models/Payment");
const WebhookEvent = require("../models/WebhookEvent");
const finzo = require("../services/finzo");
const payments = require("../services/payments");
const { wrap } = require("../utils/helpers");

const router = express.Router();

const handle = wrap(async (req, res) => {
  // 1) The signature proves the request really comes from FINZO
  if (!finzo.verifyCallback(req.rawBody, req.get("x-finzo-signature"))) {
    return res.status(401).json({ ok: false, error: "invalid signature" });
  }

  // 2) The same delivery can arrive more than once
  const deliveryId = String(req.get("x-finzo-delivery-id") || "").slice(0, 200);
  if (deliveryId && (await WebhookEvent.exists({ deliveryId }))) {
    return res.status(200).json({ ok: true, duplicate: true });
  }

  const body = req.body || {};
  const ev = finzo.parseEvent(body);

  // 3) Find our payment (by our order ID, then by FINZO's reference)
  let payment = null;
  if (ev.orderIds.length) {
    payment = await Payment.findOne({
      $or: [{ orderId: { $in: ev.orderIds } }, { finzoOrderId: { $in: ev.orderIds } }],
    });
  }
  if (!payment && ev.refs.length) {
    payment = await Payment.findOne({ gatewayRef: { $in: ev.refs } });
  }

  if (!payment) {
    // Also what happens for FINZO's "Send test callback"
    console.warn("FINZO callback for unknown order:", ev.orderIds.join(",") || "?", ev.event);
  } else if (ev.status !== "pending") {
    if (payment.type === "deposit") {
      await payments.settleDeposit(payment.orderId, ev.status, {
        ref: ev.refs[0] || "",
        raw: body,
        reason: "Payment " + (ev.rawStatus || "failed"),
      });
    } else if (ev.status === "success") {
      await payments.finalizeWithdraw(payment);
    } else if (ev.status === "failed") {
      await payments.refundWithdraw(payment, "Payout failed", "failed", ["processing"]);
    }
  }

  // Remember the delivery only after it was handled; a failed one is retried by FINZO
  if (deliveryId) {
    await WebhookEvent.create({ deliveryId, event: ev.event }).catch(() => {});
  }
  res.status(200).json({ ok: true });
});

router.post("/finzo/callback", handle);
router.post("/finzo/upi-callback", handle);
router.post("/finzo/payout-callback", handle);

module.exports = router;
