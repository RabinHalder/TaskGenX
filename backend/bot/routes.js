const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const { sendMessage, callTelegram } = require('../services/telegram');

const router = express.Router();

const TEXT = {
  welcome: {
    en:
      'Welcome to TaskGenX 👋\n\n' +
      'Complete simple tasks, invite your friends and earn rewards, all inside Telegram.\n\n' +
      '• Pick a task and submit your proof\n' +
      '• Get paid after approval\n' +
      '• Withdraw to UPI or FINZO Wallet\n\n' +
      'Tap the button below to get started.',
    bn:
      'TaskGenX-এ স্বাগতম 👋\n\n' +
      'সহজ টাস্ক সম্পন্ন করুন, বন্ধুদের আমন্ত্রণ জানান এবং রিওয়ার্ড অর্জন করুন, সবকিছু Telegram-এর ভেতরেই।\n\n' +
      '• একটি টাস্ক বেছে নিন ও প্রমাণ জমা দিন\n' +
      '• অনুমোদনের পর রিওয়ার্ড পান\n' +
      '• UPI বা FINZO Wallet-এ উইথড্র করুন\n\n' +
      'শুরু করতে নিচের বাটনে চাপুন।'
  },
  help: {
    en:
      'How can we help?\n\n' +
      '• Open the app and go to Profile → Help & FAQ for quick answers.\n' +
      '• Use the Contact support button in Profile if you need personal help.\n\n' +
      'Tip: we never ask for your UPI PIN, OTP or password.',
    bn:
      'আমরা কীভাবে সাহায্য করতে পারি?\n\n' +
      '• দ্রুত উত্তরের জন্য অ্যাপ খুলে প্রোফাইল → সাহায্য ও সাধারণ প্রশ্ন দেখুন।\n' +
      '• ব্যক্তিগত সহায়তা দরকার হলে প্রোফাইলের সাপোর্ট বাটন ব্যবহার করুন।\n\n' +
      'মনে রাখবেন: আমরা কখনো আপনার UPI পিন, OTP বা পাসওয়ার্ড চাই না।'
  },
  button: { en: '🚀 Open TaskGenX', bn: '🚀 TaskGenX খুলুন' }
};

function webhookSecret() {
  return crypto.createHash('sha256').update(String(process.env.BOT_TOKEN || '')).digest('hex').slice(0, 32);
}

function appUrl() {
  return process.env.CLIENT_URL || process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
}

async function userLang(telegramId) {
  try {
    const u = await User.findOne({ telegramId: telegramId }).select('language');
    return u && u.language === 'bn' ? 'bn' : 'en';
  } catch (e) {
    return 'en';
  }
}

router.post('/webhook', async (req, res) => {
  if (req.get('X-Telegram-Bot-Api-Secret-Token') !== webhookSecret()) {
    return res.sendStatus(401);
  }
  res.sendStatus(200);

  try {
    const msg = req.body && req.body.message;
    if (!msg || !msg.text || !msg.chat) return;

    const fromId = msg.from ? msg.from.id : msg.chat.id;
    const lang = await userLang(fromId);
    const url = appUrl();
    const extra = {};
    if (url.startsWith('https://')) {
      extra.reply_markup = { inline_keyboard: [[{ text: TEXT.button[lang], web_app: { url: url } }]] };
    }

    if (/^\/start/.test(msg.text)) {
      await sendMessage(msg.chat.id, TEXT.welcome[lang], extra);
    } else if (/^\/help/.test(msg.text)) {
      await sendMessage(msg.chat.id, TEXT.help[lang], extra);
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
