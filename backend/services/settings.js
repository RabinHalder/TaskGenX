const Setting = require('../models/Setting');

let cache = null;
let cachedAt = 0;
const TTL_MS = 15000;

async function getSettings() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;
  cache = await Setting.getSettings();
  cachedAt = Date.now();
  return cache;
}

function clearSettingsCache() {
  cache = null;
  cachedAt = 0;
}

module.exports = { getSettings, clearSettingsCache };
