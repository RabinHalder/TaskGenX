/* FINZO Wallet Gateway API adapter.
   Written from the FINZO documentation dated 23 Oct 2026.
   Needs these environment variables: FINZO_API_KEY, FINZO_USER_ID (or FINZO_MERCHANT_ID),
   and optionally FINZO_BASE_URL (default https://finzowallet.com). */
const crypto = require("crypto");

function num(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function conf() {
  return {
    base: (process.env.FINZO_BASE_URL || "https://finzowallet.com").replace(/\/+$/, ""),
    userId: process.env.FINZO_USER_ID || process.env.FINZO_MERCHANT_ID || "",
    key: process.env.FINZO_API_KEY || "",
  };
}

// FINZO's own limits (from its documentation). Override with env variables if FINZO changes them.
function depositLimits() {
  return {
    min: num(process.env.FINZO_UPI_DEPOSIT_MIN, 50),
    max: num(process.env.FINZO_UPI_DEPOSIT_MAX, 100000),
  };
}

function payoutLimits(method) {
  if (method === "upi") {
    return {
      min: num(process.env.FINZO_UPI_PAYOUT_MIN, 50),
      max: num(process.env.FINZO_UPI_PAYOUT_MAX, 50000),
    };
  }
  return {
    min: num(process.env.FINZO_WALLET_PAY_MIN, 1),
    max: num(process.env.FINZO_WALLET_PAY_MAX, 10000),
  };
}

function gatewayError(message, props) {
  const e = new Error(message);
  Object.assign(e, props || {});
  return e;
}

// First plain value found for any of the keys (looks inside "data" first, then top level).
function pick(json, ...keys) {
  const sources = [json && json.data, json];
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const k of keys) {
      const v = src[k];
      if (v !== undefined && v !== null && v !== "" && typeof v !== "object") return v;
    }
  }
  return undefined;
}

// All plain values found for the keys, as strings.
function collect(json, keys) {
  const out = [];
  for (const src of [json && json.data, json]) {
    if (!src || typeof src !== "object") continue;
    for (const k of keys) {
      const v = src[k];
      if (v !== undefined && v !== null && v !== "" && typeof v !== "object") {
        const s = String(v);
        if (!out.includes(s)) out.push(s);
      }
    }
  }
  return out;
}

// FINZO statuses: pending, processing, success, failed, expired, cancelled, refunded
function normalize(s) {
  const v = String(s === undefined || s === null ? "" : s).toLowerCase().trim();
  if (["success", "successful", "paid", "completed", "complete", "done", "credited"].includes(v)) return "success";
  if (["failed", "failure", "rejected", "expired", "cancelled", "canceled", "declined", "refunded", "reversed"].includes(v)) {
    return "failed";
  }
  return "pending";
}

async function call(method, path, opts) {
  opts = opts || {};
  const c = conf();
  if (!c.userId || !c.key) {
    throw gatewayError("FINZO is not configured", { code: "NOT_CONFIGURED", definite: true });
  }

  const headers = {
    Accept: "application/json",
    "X-User-ID": c.userId,
    "X-API-Key": c.key,
  };
  let body;
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body || {});
    if (opts.orderId) headers["Unique-Order-ID"] = opts.orderId;
  }

  let url = c.base + path;
  if (opts.query) url += "?" + new URLSearchParams(opts.query).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res;
  try {
    res = await fetch(url, { method, headers, body, signal: controller.signal });
  } catch (e) {
    // We cannot know whether FINZO received the request.
    throw gatewayError("FINZO did not respond", { code: "NETWORK", definite: false });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = null;
  }

  if (res.ok && json && json.success !== false) return json;

  const status = res.status;
  const code = String((json && json.code) || "HTTP_" + status);
  const message = String((json && json.message) || "FINZO error (" + status + ")");

  // "definite" = FINZO did not create the order, so refunding the user is safe.
  // 5xx, timeouts and DUPLICATE_ORDER_ID are uncertain: we check the order status instead.
  let definite;
  if (res.ok) {
    definite = !!json; // 2xx with success:false
  } else {
    definite =
      [400, 401, 403, 404, 405, 422, 429].includes(status) ||
      (status === 409 && code !== "DUPLICATE_ORDER_ID");
  }

  console.error("FINZO request failed:", method, path, status, code);
  throw gatewayError(message, {
    status,
    code,
    definite,
    orderNotFound: status === 404 && /ORDER_NOT_FOUND/i.test(code),
  });
}

function parseStatus(json, label) {
  const raw = pick(json, "status", "payment_status", "payout_status", "txn_status", "state");
  if (raw === undefined) {
    console.error("FINZO: no status in " + label + " response:", JSON.stringify(json).slice(0, 400));
  }
  return {
    status: normalize(raw),
    ref: String(pick(json, "payment_id", "paymentId", "transaction_id", "txn_id", "id", "receipt") || ""),
    raw: json,
  };
}

/* ------------------------------ DEPOSIT (UPI payment link) ------------------------------ */

async function createUpiOrder({ orderId, amount }) {
  const json = await call("POST", "/api/gateway/upi-payment", {
    orderId,
    body: { amount: Math.round(Number(amount)) },
  });
  const paymentUrl = pick(json, "payment_url", "paymentUrl", "url", "link");
  if (!paymentUrl || !/^https:\/\//i.test(String(paymentUrl))) {
    console.error("FINZO: no payment link in response:", JSON.stringify(json).slice(0, 400));
    throw gatewayError("FINZO did not return a payment link", { code: "NO_PAYMENT_URL", definite: true });
  }
  return {
    gatewayRef: String(pick(json, "payment_id", "paymentId", "transaction_id", "id") || ""),
    paymentUrl: String(paymentUrl),
    raw: json,
  };
}

async function checkDeposit(orderId) {
  const json = await call("GET", "/api/gateway/upi-payment/status", { query: { order_id: orderId } });
  return parseStatus(json, "deposit status");
}

/* ------------------------------ WITHDRAW ------------------------------ */

async function payoutUpi({ orderId, amount, upi, name }) {
  const json = await call("POST", "/api/gateway/payout", {
    orderId,
    body: {
      method: "upi",
      amount: Number(Number(amount).toFixed(2)),
      upi_id: upi,
      name,
    },
  });
  return parseStatus(json, "payout");
}

async function walletPay({ orderId, amount, wallet, remark }) {
  const json = await call("POST", "/api/gateway/pay", {
    orderId,
    body: {
      number: wallet,
      amount: Number(Number(amount).toFixed(2)),
      remark: String(remark || "").slice(0, 120),
    },
  });
  return parseStatus(json, "wallet pay");
}

// UPI payouts and wallet payments use different status endpoints.
async function checkPayout(orderId, method) {
  const path = method === "upi" ? "/api/gateway/payout/status" : "/api/gateway/status";
  const json = await call("GET", path, { query: { order_id: orderId } });
  return parseStatus(json, "payout status");
}

// true / false, or null when FINZO could not tell us.
async function walletExists(number) {
  try {
    const json = await call("GET", "/api/gateway/user", { query: { number } });
    const v = pick(json, "wallet_exists", "walletExists", "exists");
    if (v === undefined) return null;
    return v === true || v === "true" || v === 1 || v === "1";
  } catch (e) {
    return null;
  }
}

/* ------------------------------ CALLBACKS ------------------------------ */

// X-Finzo-Signature = "sha256=" + HMAC-SHA256(raw body, API key), hex.
function verifyCallback(rawBody, header) {
  const key = conf().key;
  if (!key || !rawBody || !header) return false;
  let given = String(header).trim().toLowerCase();
  if (!given.startsWith("sha256=")) given = "sha256=" + given;
  const expected = "sha256=" + crypto.createHmac("sha256", key).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Reads a callback body without assuming exact field names.
function parseEvent(body) {
  const raw = pick(body, "status", "payment_status", "payout_status", "txn_status");
  return {
    event: body && body.event ? String(body.event) : "",
    rawStatus: raw === undefined ? "" : String(raw),
    status: normalize(raw),
    orderIds: collect(body, ["unique_order_id", "uniqueOrderId", "api_order_id", "order_id", "orderId", "merchant_order_id"]),
    refs: collect(body, ["payment_id", "paymentId", "transaction_id", "txn_id", "id"]),
  };
}

module.exports = {
  depositLimits,
  payoutLimits,
  createUpiOrder,
  checkDeposit,
  payoutUpi,
  walletPay,
  checkPayout,
  walletExists,
  verifyCallback,
  parseEvent,
  normalize,
  pick,
};
