const User = require('../models/User');

async function callTelegram(method, payload) {
  const token = process.env.BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch('https://api.telegram.org/bot' + token + '/' + method, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram API error (' + method + '):', data.description);
      return null;
    }
    return data.result;
  } catch (err) {
    console.error('Telegram request failed (' + method + '):', err.message);
    return null;
  }
}

async function sendMessage(chatId, text, extra) {
  return callTelegram('sendMessage', Object.assign({ chat_id: chatId, text: text }, extra || {}));
}

async function notifyUser(telegramId, text) {
  try {
    const user = await User.findOne({ telegramId: telegramId }).select('notificationsOn');
    if (!user || !user.notificationsOn) return null;
    return await sendMessage(telegramId, text);
  } catch (err) {
    console.error('notifyUser failed:', err.message);
    return null;
  }
}

module.exports = { callTelegram, sendMessage, notifyUser };
