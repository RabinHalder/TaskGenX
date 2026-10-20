const crypto = require('crypto');
const { getOrCreateUser } = require('../services/userService');
const { getSettings } = require('../services/settings');
const { isAdminId } = require('../services/adminCheck');

function verifyInitData(initData, botToken, maxAgeSeconds) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map((pair) => pair[0] + '=' + pair[1])
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  const a = Buffer.from(calculated, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  let user;
  try {
    user = JSON.parse(params.get('user'));
  } catch (e) {
    return null;
  }
  if (!user || !user.id) return null;

  return { user: user, startParam: params.get('start_param') || '' };
}

async function auth(req, res, next) {
  try {
    const initData = req.get('X-Telegram-Init-Data');
    const verified = verifyInitData(initData, process.env.BOT_TOKEN, 24 * 60 * 60);

    if (!verified) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired session. Please reopen the app from Telegram.'
      });
    }

    const settings = await getSettings();
    const user = await getOrCreateUser(verified.user, verified.startParam, settings);
    const admin = isAdminId(user.telegramId, settings);

    if (user.isBanned && !admin) {
      return res.status(403).json({
        success: false,
        code: 'BANNED',
        message: user.banReason || 'Your account has been banned.'
      });
    }

    if (settings.maintenance.enabled && !admin) {
      return res.status(503).json({
        success: false,
        code: 'MAINTENANCE',
        message: settings.maintenance.message
      });
    }

    req.user = user;
    req.isAdmin = admin;
    req.settings = settings;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
}

module.exports = auth;
