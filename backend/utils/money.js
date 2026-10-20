function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function maskUserId(id) {
  const s = String(id || '');
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

// Day key in Indian time (YYYY-MM-DD)
function dayKeyIST(date) {
  const base = date ? date.getTime() : Date.now();
  return new Date(base + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function startOfTodayIST() {
  return new Date(dayKeyIST() + 'T00:00:00+05:30');
}

function monthKey(date) {
  return dayKeyIST(date).slice(0, 7);
}

module.exports = { round2, maskUserId, maskUpi, dayKeyIST, startOfTodayIST, monthKey };
