const express = require('express');
const User = require('../../models/User');
const { sendMessage } = require('../../services/telegram');

const router = express.Router();

let lastRun = { running: false, total: 0, sent: 0, failed: 0, startedAt: null, finishedAt: null };

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.post('/', async (req, res) => {
  try {
    if (lastRun.running) {
      return res.status(409).json({ success: false, code: 'BUSY', message: 'A broadcast is already running.' });
    }

    const text = String(req.body.text || '').trim();
    if (!text || text.length > 3500) {
      return res.status(400).json({ success: false, code: 'INVALID', message: 'Message must be 1 to 3500 characters.' });
    }

    const audience = String(req.body.audience || 'all');
    const filter = { isBanned: false, notificationsOn: true };

    if (audience === 'active7') {
      filter.lastActiveAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (audience.startsWith('level:')) {
      const lv = Number(audience.split(':')[1]);
      if (!(lv >= 1)) {
        return res.status(400).json({ success: false, code: 'INVALID', message: 'Invalid level.' });
      }
      filter.level = lv;
    }

    const extra = {};
    const buttonText = String(req.body.buttonText || '').trim();
    const buttonUrl = String(req.body.buttonUrl || '').trim();
    if (buttonText && /^https?:\/\//i.test(buttonUrl)) {
      extra.reply_markup = { inline_keyboard: [[{ text: buttonText.slice(0, 60), url: buttonUrl }]] };
    }

    const total = await User.countDocuments(filter);
    lastRun = { running: true, total: total, sent: 0, failed: 0, startedAt: new Date(), finishedAt: null };
    res.json({ success: true, data: { queued: total } });

    setImmediate(async () => {
      try {
        const cursor = User.find(filter).select('telegramId').lean().cursor();
        for await (const u of cursor) {
          const result = await sendMessage(u.telegramId, text, extra);
          if (result) lastRun.sent++;
          else lastRun.failed++;
          await wait(45);
        }
      } catch (err) {
        console.error('Broadcast error:', err.message);
      }
      lastRun.running = false;
      lastRun.finishedAt = new Date();
    });
  } catch (err) {
    console.error('Broadcast start error:', err);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
});

router.get('/status', (req, res) => {
  res.json({ success: true, data: lastRun });
});

module.exports = router;
