function isUpiId(v) {
  return /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z0-9]{2,32}$/.test(String(v || ''));
}

function isWalletNumber(v) {
  return /^\d{10}$/.test(String(v || ''));
}

function cleanName(v) {
  return String(v || '')
    .replace(/[^\p{L}\p{N} .'-]/gu, '')
    .trim()
    .slice(0, 60);
}

module.exports = { isUpiId, isWalletNumber, cleanName };
