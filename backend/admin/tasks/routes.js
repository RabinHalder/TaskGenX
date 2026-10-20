const express = require('express');
const mongoose = require('mongoose');
const Task = require('../../models/Task');
const Submission = require('../../models/Submission');
const User = require('../../models/User');
const { approveSubmission, rejectSubmission } = require('../../services/taskService');
const { getFileBuffer } = require('../../services/telegram');

const router = express.Router();

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, code: code, message: message });
}

function readTaskBody(b, requireAll) {
  const data = {};

  if (b.title !== undefined || requireAll) {
    const t = String(b.title || '').trim();
    if (!t) return { error: 'Title is required.' };
    data.title = t.slice(0, 120);
  }
  if (b.category !== undefined || requireAll) {
    const c = String(b.category || '').trim();
    if (!c) return { error: 'Category is required.' };
    data.category = c.slice(0, 40);
  }
  if (b.reward !== undefined || requireAll) {
    const r = Number(b.reward);
    if (!Number.isFinite(r) || r < 0) return { error: 'Enter a valid reward.' };
    data.reward = Math.round(r * 100) / 100;
  }
  if (b.description !== undefined) data.description = String(b.description).slice(0, 1000);
  if (b.link !== undefined) data.link = String(b.link).trim().slice(0, 500);
  if (b.instructions !== undefined) {
    data.instructions = (Array.isArray(b.instructions) ? b.instructions : [])
      .map((s) => String(s).trim().slice(0, 300))
      .filter(Boolean)
      .slice(0, 15);
  }
  if (b.maxUsers !== undefined) {
    const m = Number(b.maxUsers);
    if (!Number.isInteger(m) || m < 0) return { error: 'User limit must be 0 or a whole number.' };
    data.maxUsers = m;
  }
  if (b.publishAt !== undefined) {
    const d = b.publishAt ? new Date(b.publishAt) : new Date();
    if (isNaN(d.getTime())) return { error: 'Invalid publish time.' };
    data.publishAt = d;
  }
  if (b.expiresAt !== undefined) {
    if (!b.expiresAt) {
      data.expiresAt = null;
    } else {
      const d = new Date(b.expiresAt);
      if (isNaN(d.getTime())) return { error: 'Invalid end time.' };
      data.expiresAt = d;
    }
  }
  if (b.status !== undefined) {
    if (!['active', 'paused', 'ended'].includes(b.status)) return { error: 'Invalid status.' };
    data.status = b.status;
  }
  return { data: data };
}

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({}).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('Admin tasks list error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = readTaskBody(req.body || {}, true);
    if (parsed.error) return fail(res, 400, 'INVALID', parsed.error);

    const task = await Task.create(Object.assign(parsed.data, { createdBy: req.user.telegramId }));
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('Admin task create error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/submissions/list', async (req, res) => {
  try {
    const status = ['pending', 'approved', 'rejected'].includes(String(req.query.status)) ? String(req.query.status) : 'pending';
    const page = Math.max(Number(req.query.page) || 1, 1);
    const perPage = 20;

    const subs = await Submission.find({ status: status })
      .sort({ createdAt: status === 'pending' ? 1 : -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('taskId', 'title category reward');

    const ids = Array.from(new Set(subs.map((s) => s.userId)));
    const users = await User.find({ telegramId: { $in: ids } }).select('telegramId firstName lastName username');
    const map = new Map(users.map((u) => [u.telegramId, u]));

    res.json({
      success: true,
      data: subs.map((s) => {
        const u = map.get(s.userId);
        return {
          id: s._id,
          status: s.status,
          userId: s.userId,
          userName: u ? u.fullName : 'Unknown',
          username: u ? u.username : '',
          taskTitle: s.taskId ? s.taskId.title : 'Deleted task',
          category: s.taskId ? s.taskId.category : '',
          reward: s.taskId ? s.taskId.reward : 0,
          note: s.proofNote,
          rejectReason: s.rejectReason,
          createdAt: s.createdAt
        };
      })
    });
  } catch (err) {
    console.error('Admin submissions error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/submissions/:id/proof', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid id.');
    const sub = await Submission.findById(req.params.id);
    if (!sub || !sub.proofFileId) return fail(res, 404, 'NOT_FOUND', 'Screenshot not found.');

    const file = await getFileBuffer(sub.proofFileId);
    if (!file) return fail(res, 502, 'FILE_ERROR', 'Could not load the screenshot.');

    const ext = String(file.path).split('.').pop().toLowerCase();
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    res.set('Content-Type', type);
    res.set('Cache-Control', 'private, max-age=300');
    res.send(file.buffer);
  } catch (err) {
    console.error('Admin proof error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/submissions/:id/approve', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid id.');
    const sub = await approveSubmission(req.params.id, req.user.telegramId);
    if (!sub) return fail(res, 404, 'NOT_FOUND', 'Submission not found or already reviewed.');
    res.json({ success: true });
  } catch (err) {
    console.error('Admin approve error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/submissions/:id/reject', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid id.');
    const sub = await rejectSubmission(req.params.id, req.user.telegramId, req.body.reason);
    if (!sub) return fail(res, 404, 'NOT_FOUND', 'Submission not found or already reviewed.');
    res.json({ success: true });
  } catch (err) {
    console.error('Admin reject error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid id.');
    const parsed = readTaskBody(req.body || {}, false);
    if (parsed.error) return fail(res, 400, 'INVALID', parsed.error);

    const task = await Task.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true });
    if (!task) return fail(res, 404, 'NOT_FOUND', 'Task not found.');
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('Admin task update error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid id.');

    const count = await Submission.countDocuments({ taskId: req.params.id });
    if (count > 0) {
      await Task.updateOne({ _id: req.params.id }, { $set: { status: 'ended' } });
      return res.json({ success: true, data: { deleted: false, ended: true } });
    }

    await Task.deleteOne({ _id: req.params.id });
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error('Admin task delete error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

module.exports = router;
