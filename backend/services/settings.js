const Setting = require("../models/Setting");

let cache = null;
let cachedAt = 0;
const TTL_MS = 10 * 1000;

// Returns settings as a plain object (cached for 10 seconds).
async function getSettings(force = false) {
  if (!force && cache && Date.now() - cachedAt < TTL_MS) return cache;

  let doc = await Setting.findOne({ key: "main" });
  if (!doc) {
    try {
      doc = await Setting.create({ key: "main" });
    } catch (e) {
      doc = await Setting.findOne({ key: "main" });
    }
  }
  cache = doc.toObject();
  cachedAt = Date.now();
  return cache;
}

function clearSettingsCache() {
  cache = null;
  cachedAt = 0;
}

module.exports = { getSettings, clearSettingsCache };
