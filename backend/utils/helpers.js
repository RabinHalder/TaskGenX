// Small shared helpers used across the backend.

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Returns "YYYY-MM-DD" for the given timezone (default India).
function dateKey(date = new Date(), tz = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function monthKey(date = new Date(), tz = "Asia/Kolkata") {
  return dateKey(date, tz).slice(0, 7);
}

function yesterdayKey(tz = "Asia/Kolkata") {
  return dateKey(new Date(Date.now() - 24 * 60 * 60 * 1000), tz);
}

function fullName(user) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.username || "User";
}

// 8997361213 -> 89******13
function maskId(id) {
  const s = String(id);
  if (s.length <= 4) return "*".repeat(s.length);
  return s.slice(0, 2) + "*".repeat(s.length - 4) + s.slice(-2);
}

// rahul@oksbi -> ra***@oksbi ; 9876543210 -> *******210
function maskDestination(value) {
  const v = String(value || "");
  if (v.includes("@")) {
    const parts = v.split("@");
    return parts[0].slice(0, 2) + "***@" + parts.slice(1).join("@");
  }
  if (v.length > 4) return "*".repeat(v.length - 3) + v.slice(-3);
  return "***";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Express 4 does not catch errors in async routes; this wrapper does.
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  round2,
  dateKey,
  monthKey,
  yesterdayKey,
  fullName,
  maskId,
  maskDestination,
  escapeHtml,
  wrap,
};
