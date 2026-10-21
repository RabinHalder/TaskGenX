const User = require('../models/User');

const API = 'https://api.telegram.org';

async function callTelegram(method, payload) {
  const token = process.env.BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(API + '/bot' + token + '/' + method, {
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

// message can be a plain string or an object like { en: '...', bn: '...' }
async function notifyUser(telegramId, message) {
  try {
    const user = await User.findOne({ telegramId: telegramId }).select('notificationsOn language');
    if (!user || !user.notificationsOn) return null;

    const text =
      typeof message === 'string' ? message : (message && (message[user.language] || message.en)) || '';
    if (!text) return null;

    return await sendMessage(telegramId, text);
  } catch (err) {
    console.error('notifyUser failed:', err.message);
    return null;
  }
}

async function notifyAdmins(text) {
  const ids = (process.env.ADMIN_IDS || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => n > 0);
  for (const id of ids) {
    await sendMessage(id, text);
  }
}

// Uploads a photo to a chat/channel and returns the Telegram file_id
async function sendPhotoBuffer(chatId, buffer, mimeType, caption) {
  const token = process.env.BOT_TOKEN;
  if (!token || !chatId) return null;

  try {
    const form = new FormData();
    form.append('chat_id', String(chatId));
    if (caption) form.append('caption', caption);
    form.append('photo', new Blob([buffer], { type: mimeType }), 'proof.jpg');

    const res = await fetch(API + '/bot' + token + '/sendPhoto', { method: 'POST', body: form });
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram sendPhoto error:', data.description);
      return null;
    }
    const photos = data.result.photo || [];
    const best = photos[photos.length - 1];
    return best ? best.file_id : null;
  } catch (err) {
    console.error('Telegram sendPhoto failed:', err.message);
    return null;
  }
}

// Downloads a file by file_id. Returns { buffer, path } or null
async function getFileBuffer(fileId) {
  const token = process.env.BOT_TOKEN;
  if (!token) return null;

  const info = await callTelegram('getFile', { file_id: fileId });
  if (!info || !info.file_path) return null;

  try {
    const res = await fetch(API + '/file/bot' + token + '/' + info.file_path);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return { buffer: Buffer.from(arr), path: info.file_path };
  } catch (err) {
    console.error('Telegram file download failed:', err.message);
    return null;
  }
}

module.exports = { callTelegram, sendMessage, notifyUser, notifyAdmins, sendPhotoBuffer, getFileBuffer };
