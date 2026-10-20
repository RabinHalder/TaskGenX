const BASE = 'https://finzowallet.com';

async function request(method, path, orderId, body) {
  const userId = process.env.FINZO_USER_ID;
  const apiKey = process.env.FINZO_API_KEY;

  if (!userId || !apiKey) {
    return { ok: false, httpStatus: 0, body: null, networkError: false, configError: true };
  }

  const headers = { Accept: 'application/json', 'X-User-ID': userId, 'X-API-Key': apiKey };
  if (method === 'POST' && orderId) headers['Unique-Order-ID'] = orderId;
  if (body) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(BASE + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    let json = null;
    try {
      json = await res.json();
    } catch (e) {
      json = null;
    }

    return {
      ok: res.ok && !!json && json.success !== false,
      httpStatus: res.status,
      body: json,
      networkError: false,
      configError: false
    };
  } catch (err) {
    return { ok: false, httpStatus: 0, body: null, networkError: true, configError: false };
  } finally {
    clearTimeout(timer);
  }
}

function createUpiPayment(orderId, amount) {
  return request('POST', '/api/gateway/upi-payment', orderId, { amount: amount });
}

function upiPaymentStatus(orderId) {
  return request('GET', '/api/gateway/upi-payment/status?order_id=' + encodeURIComponent(orderId));
}

function createPayout(orderId, payload) {
  return request('POST', '/api/gateway/payout', orderId, payload);
}

function payoutStatus(orderId) {
  return request('GET', '/api/gateway/payout/status?order_id=' + encodeURIComponent(orderId));
}

function createWalletPay(orderId, payload) {
  return request('POST', '/api/gateway/pay', orderId, payload);
}

function walletPayStatus(orderId) {
  return request('GET', '/api/gateway/status?order_id=' + encodeURIComponent(orderId));
}

function pickStatus(body) {
  if (!body) return '';
  const d = body.data && typeof body.data === 'object' ? body.data : {};
  return String(d.status || body.status || '').toLowerCase();
}

function pickOrderId(body) {
  if (!body) return '';
  const d = body.data && typeof body.data === 'object' ? body.data : {};
  return String(d.unique_order_id || d.order_id || d.orderId || d.uniqueOrderId || body.order_id || '');
}

function pickPaymentUrl(body) {
  if (!body) return '';
  const d = body.data && typeof body.data === 'object' ? body.data : {};
  return String(d.payment_url || d.paymentUrl || d.url || d.link || '');
}

module.exports = {
  createUpiPayment,
  upiPaymentStatus,
  createPayout,
  payoutStatus,
  createWalletPay,
  walletPayStatus,
  pickStatus,
  pickOrderId,
  pickPaymentUrl
};
