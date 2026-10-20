const express = require('express');
const crypto = require('crypto');
const { sendMessage, callTelegram } = require('../services/telegram');

const router = express.Router();

function webhookSecret() {
  return crypto.createHash('sha256').update(String(process.env.BOT_TOKEN || '')).digest('hex').slice(0, 32);
}

function appUrl() {
  return process.env.CLIENT_URL || process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
}

router.post('/webhook', async (req, res) => {
  if (req.get('X-Telegram-Bot-Api-Secret-Token') !== webhookSecret()) {
    return res.sendStatus(401);
  }
  res.sendStatus(200);

  try {
    const msg = req.body && req.body.message;
    if (!msg || !msg.text || !msg.chat) return;

    if (/^\/start/.test(msg.text)) {
      const url = appUrl();
      const extra = {};
      if (url.startsWith('https://')) {
        extra.reply_markup = { inline_keyboard: [[{ text: '🚀 Open TaskGenX', web_app: { url: url } }]] };
      }
      await sendMessage(
        msg.chat.id,
        '👋 Welcome to TaskGenX!\n\nComplete simple tasks, invite your friends and earn rewards.',
        extra
      );
    }
  } catch (err) {
    console.error('Bot webhook error:', err.message);
  }
});

async function registerWebhook() {
  const base = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  if (!base || !process.env.BOT_TOKEN) {
    console.log('Bot webhook not set (PUBLIC_URL or BOT_TOKEN is missing).');
    return;
  }
  const result = await callTelegram('setWebhook', {
    url: base.replace(/\/$/, '') + '/bot/webhook',
    secret_token: webhookSecret(),
    allowed_updates: ['message']
  });
  console.log('Bot webhook:', result ? 'set' : 'failed');
}

module.exports = { router, registerWebhook };
