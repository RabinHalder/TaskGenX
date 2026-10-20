require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');
const adminOnly = require('./middleware/admin');
const { router: botRouter, registerWebhook } = require('./bot/routes');
const { startJobs } = require('./services/jobs');

const app = express();
app.set('trust proxy', 1);

// Telegram opens the app inside a frame, so frame blocking and CSP are turned off
app.use(helmet({ contentSecurityPolicy: false, frameguard: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Screenshot uploads need a bigger limit (this must come before the global parser)
app.use('/api/user/task', express.json({ limit: '7mb' }));

app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' }
  })
);

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// Public routes (no Telegram login): bot webhook and payment callback
app.use('/bot', botRouter);
app.use('/api/finzo', require('./payments/webhook'));

// User routes (Telegram login required)
app.use('/api/user', auth);
app.use('/api/user/home', require('./user/home/routes'));
app.use('/api/user/task', require('./user/task/routes'));
app.use('/api/user/referral', require('./user/referral/routes'));
app.use('/api/user/profile', require('./user/profile/routes'));
app.use('/api/user/club', require('./user/club/routes'));
app.use('/api/user/payments', require('./payments/routes'));

// Admin routes (Telegram login + admin check on the server)
app.use('/api/admin', auth, adminOnly);
app.use('/api/admin/dashboard', require('./admin/dashboard/routes'));
app.use('/api/admin/users', require('./admin/users/routes'));
app.use('/api/admin/tasks', require('./admin/tasks/routes'));
app.use('/api/admin/broadcast', require('./admin/broadcast/routes'));
app.use('/api/admin/settings', require('./admin/settings/routes'));

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found.' });
});

// The mini app screens (frontend folder) are served from this same server
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, code: 'BAD_JSON', message: 'Invalid JSON body.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, code: 'TOO_LARGE', message: 'The upload is too large.' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('TaskGenX server running on port ' + PORT);
    registerWebhook();
    startJobs();
  });
});
