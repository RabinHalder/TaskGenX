const express = require('express');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const finzo = require('../services/finzo');
const { applyProviderStatus } = require('../services/paymentService');

const router = express.Router();

function signatureValid(rawBody, header, apiKey) {
  if (!rawBody || !apiKey) return false;
  const given = String(header || '').replace(/^sha256=/i, '').trim();
  const expected = crypto.createHmac('sha256', apiKey).update(rawBody).digest('hex');
  if (given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given, 'utf8'), Buffer.from(expected, 'utf8'));
}

router.post('/callback', async (req, res) => {
  try {
    const valid = signatureValid(req.rawBody, req.get('X-Finzo-Signature'), process.env.FINZO_API_KEY);
    if (!valid) return res.status(401).json({ ok: false });

    const body = req.body || {};
    const deliveryId = String(req.get('X-Finzo-Delivery-Id') || '');
    const orderId = finzo.pickOrderId(body);
    const status = finzo.pickStatus(body);

    const tx = orderId ? await Transaction.findOne({ orderId: orderId }) : null;
    if (!tx) {
      console.log('FINZO callback for an unknown order:', JSON.stringify(body));
      return res.status(200).json({ ok: true });
    }

    if (deliveryId && tx.processedDeliveries.includes(deliveryId)) {
      return res.status(200).json({ ok: true });
    }

    await applyProviderStatus(tx, status);

    if (deliveryId) {
      await Transaction.updateOne({ _id: tx._id }, { $addToSet: { processedDeliveries: deliveryId } });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('FINZO callback error:', err);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
