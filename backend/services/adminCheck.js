function envAdminIds() {
  return (process.env.ADMIN_IDS || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => n > 0);
}

function isAdminId(telegramId, settings) {
  const id = Number(telegramId);
  if (envAdminIds().includes(id)) return true;
  if (settings && Array.isArray(settings.extraAdmins)) {
    return settings.extraAdmins.map(Number).includes(id);
  }
  return false;
}

module.exports = { isAdminId };
