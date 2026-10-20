function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function maskUserId(id) {
  const s = String(id);
  if (s.length <= 4) return s;
  return s.slice(0, 2) + '•'.repeat(s.length - 4) + s.slice(-2);
}

function maskUpi(upi) {
  if (!upi) return '';
  const s = String(upi);
  const at = s.indexOf('@');
  const name = at === -1 ? s : s.slice(0, at);
  const handle = at === -1 ? '' : s.slice(at);
  return name.slice(0, 2) + '••••' + handle;
}

function monthKey(date) {
  const d = date || new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return d.getFullYear() + '-' + m;
}

module.exports = { round2, maskUserId, maskUpi, monthKey };
