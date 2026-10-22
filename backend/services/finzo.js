// FINZO Wallet API adapter.
// ASSUMPTION: endpoint paths, field names and the signature rule below are
// placeholders. Adjust them to match the FINZO documentation.
// All paths can be overridden with environment variables.
const crypto = require("crypto");

function conf() {
  return {
    base: (process.env.FINZO_BASE_URL || "").replace(/\/+$/, ""),
    key: process.env.FINZO_API_KEY || "",
    secret: process.env.FINZO_API_SECRET || "",
    merchant: process.env.FINZO_MERCHANT_ID || "",
    paths: {
      upiCreate: process.env.FINZO_PATH_UPI_CREATE || "/upi/create",
      upiStatus: process.env.FINZO_PATH_UPI_STATUS || "/upi/status",
      payoutUpi: process.env.FINZO_PATH_PAYOUT_UPI || "/payout/upi",
      walletPay: process.env.FINZO_PATH_WALLET_PAY || "/wallet/pay",
      payoutStatus: process.env.FINZO_PATH_PAYOUT_STATUS || "/payout/status",
    },
  };
}

// "definite" = we know the request did NOT go through, so refunding is safe.
function definiteError(message) {
  const e = new Error(message);
  e.definite = true;
  return e;
}

// Signature: HMAC-SHA256 (hex) over "k=v&k=v" of sorted non-empty params.
function signParams(params, secret) {
  const str = Object.keys(params)
    .filter(
      (k) =>
        k !== "sign" &&
        k !== "signature" &&
        params[k] !== undefined &&
        params[k] !== null &&
        params[k] !== ""
    )
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHmac("sha256", secret).update(str).digest("hex");
}

function verifyCallback(body) {
  const c = conf();
  if (!c.secret || !body) return false;
  const given = String(body.sign || body.signature || "").toLowerCase();
  if (!given) return false;
  const expected = signParams(body, c.secret);
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const src of [obj, obj.data]) {
    if (!src || typeof src !== "object") continue;
    for (const k of keys) {
      if (src[k] !== undefined && src[k] !== null && src[k] !== "") return src[k];
    }
  }
  return undefined;
}

function normalize(s) {
  const v = String(s || "").toLowerCase();
  if (["success", "successful", "paid", "completed", "complete", "done", "credited"].includes(v))
    return "success";
  if (["failed", "failure", "rejected", "expired", "cancelled", "canceled", "declined", "refunded"].includes(v))
    return "failed";
  return "pending";
}

async function post(path, body) {
  const c = conf();
  if (!c.base || !c.key || !c.secret) throw definiteError("FINZO is not configured");

  const payload = { ...body };
  if (c.merchant) payload.merchant_id = c.merchant;
  payload.sign = signParams(payload, c.secret);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res;
  try {
    res = await fetch(c.base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": c.key },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (e) {
    /* not JSON */
  }

  if (res.status >= 500) throw new Error(`FINZO server error ${res.status}`);
  if (res.status >= 400) throw definiteError(pick(json, "message", "error") || `FINZO rejected (${res.status})`);

  const st = json.status;
  if (json.success === false || st === false || (typeof st === "string" && /^(fail|error)/i.test(st))) {
    throw definiteError(pick(json, "message", "error") || "FINZO request failed");
  }
  return json;
}

async function createUpiOrder({ orderId, amount, customerId, callbackUrl, redirectUrl }) {
  const json = await post(conf().paths.upiCreate, {
    order_id: orderId,
    amount: Number(amount).toFixed(2),
    customer_id: customerId,
    callback_url: callbackUrl,
    redirect_url: redirectUrl,
  });
  const paymentUrl = pick(json, "payment_url", "paymentUrl", "url", "link");
  if (!paymentUrl) throw definiteError("FINZO did not return a payment link");
  return {
    gatewayRef: String(pick(json, "transaction_id", "txn_id", "id", "ref") || ""),
    paymentUrl,
    raw: json,
  };
}

async function checkDeposit(orderId) {
  const json = await post(conf().paths.upiStatus, { order_id: orderId });
  return {
    status: normalize(pick(json, "status", "payment_status", "txn_status")),
    ref: String(pick(json, "transaction_id", "txn_id", "id") || ""),
    amount: pick(json, "amount"),
    raw: json,
  };
}

async function payoutUpi({ orderId, amount, upi, name }) {
  const json = await post(conf().paths.payoutUpi, {
    order_id: orderId,
    amount: Number(amount).toFixed(2),
    upi_id: upi,
    name,
  });
  return {
    status: normalize(pick(json, "status", "payout_status", "txn_status")),
    ref: String(pick(json, "transaction_id", "txn_id", "id") || ""),
    raw: json,
  };
}

async function walletPay({ orderId, amount, wallet }) {
  const json = await post(conf().paths.walletPay, {
    order_id: orderId,
    amount: Number(amount).toFixed(2),
    wallet_id: wallet,
  });
  return {
    status: normalize(pick(json, "status", "payout_status", "txn_status")),
    ref: String(pick(json, "transaction_id", "txn_id", "id") || ""),
    raw: json,
  };
}

async function checkPayout(orderId) {
  const json = await post(conf().paths.payoutStatus, { order_id: orderId });
  return {
    status: normalize(pick(json, "status", "payout_status", "txn_status")),
    ref: String(pick(json, "transaction_id", "txn_id", "id") || ""),
    raw: json,
  };
}

module.exports = {
  createUpiOrder,
  checkDeposit,
  payoutUpi,
  walletPay,
  checkPayout,
  verifyCallback,
  normalize,
  pick,
};
