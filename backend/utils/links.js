// Referral / app links. The referral code is the user's Telegram ID.
function referralLink(settings, tgId) {
  const bot = (settings.app && settings.app.botUsername) || process.env.BOT_USERNAME || "";
  if (!bot) return "";
  const short = settings.app && settings.app.appShortName;
  return short
    ? `https://t.me/${bot}/${short}?startapp=${tgId}`
    : `https://t.me/${bot}?startapp=${tgId}`;
}

module.exports = { referralLink };
