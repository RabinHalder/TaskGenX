require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
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

app.get('/', (req, res) => {
  res.json({ success: true, app: 'TaskGenX', message: 'Server is running' });
});

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// All /api/user routes need a verified Telegram session
app.use('/api/user', auth);
app.use('/api/user/home', require('./user/home/routes'));

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, code: 'BAD_JSON', message: 'Invalid JSON body.' });
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
  });
});
