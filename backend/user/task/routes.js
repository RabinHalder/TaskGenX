const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Task = require('../../models/Task');
const Submission = require('../../models/Submission');
const { sendPhotoBuffer } = require('../../services/telegram');

const router = express.Router();
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, code: code, message: message });
}

function isOpenTask(task) {
  const now = Date.now();
  if (task.status !== 'active') return false;
  if (task.publishAt && task.publishAt.getTime() > now) return false;
  if (task.expiresAt && task.expiresAt.getTime() <= now) return false;
  if (task.maxUsers > 0 && task.filledCount >= task.maxUsers) return false;
  return true;
}

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const category = String(req.query.category || 'All');

    const filter = {
      status: 'active',
      publishAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    };
    if (category !== 'All') filter.category = category;

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).limit(200);
    const open = tasks.filter((t) => t.maxUsers === 0 || t.filledCount < t.maxUsers);

    const subs = await Submission.find({
      userId: req.user.telegramId,
      taskId: { $in: open.map((t) => t._id) }
    }).select('taskId status');
    const subMap = new Map(subs.map((s) => [String(s.taskId), s.status]));

    res.json({
      success: true,
      data: open.map((t) => ({
        id: t._id,
        title: t.title,
        description: t.description,
        category: t.category,
        reward: t.reward,
        expiresAt: t.expiresAt,
        slotsLeft: t.maxUsers > 0 ? t.maxUsers - t.filledCount : null,
        myStatus: subMap.get(String(t._id)) || null
      }))
    });
  } catch (err) {
    console.error('Task list error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/history', async (req, res) => {
  try {
    const filter = { userId: req.user.telegramId };
    const status = String(req.query.status || '');
    if (['pending', 'approved', 'rejected'].includes(status)) filter.status = status;

    const subs = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('taskId', 'title category reward');

    res.json({
      success: true,
      data: subs.map((s) => ({
        id: s._id,
        taskTitle: s.taskId ? s.taskId.title : 'Deleted task',
        category: s.taskId ? s.taskId.category : '',
        status: s.status,
        reward: s.status === 'approved' ? s.reward : s.taskId ? s.taskId.reward : 0,
        rejectReason: s.rejectReason,
        createdAt: s.createdAt
      }))
    });
  } catch (err) {
    console.error('Task history error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid task.');
    const task = await Task.findById(req.params.id);
    if (!task || task.status === 'paused') return fail(res, 404, 'NOT_FOUND', 'Task not found.');

    const mine = await Submission.findOne({ taskId: task._id, userId: req.user.telegramId });

    res.json({
      success: true,
      data: {
        id: task._id,
        title: task.title,
        description: task.description,
        category: task.category,
        reward: task.reward,
        link: task.link,
        instructions: task.instructions,
        expiresAt: task.expiresAt,
        slotsLeft: task.maxUsers > 0 ? Math.max(task.maxUsers - task.filledCount, 0) : null,
        isOpen: isOpenTask(task),
        myStatus: mine ? mine.status : null,
        rejectReason: mine ? mine.rejectReason : ''
      }
    });
  } catch (err) {
    console.error('Task detail error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/:id/submit', async (req, res) => {
  let reserved = false;
  let task = null;

  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid task.');

    task = await Task.findById(req.params.id);
    if (!task || !isOpenTask(task)) return fail(res, 400, 'TASK_CLOSED', 'This task is not available.');

    const userId = req.user.telegramId;
    const existing = await Submission.findOne({ taskId: task._id, userId: userId });
    if (existing && existing.status !== 'rejected') {
      return fail(res, 400, 'ALREADY_SUBMITTED', 'You have already submitted this task.');
    }

    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(req.body.image || ''));
    if (!match) return fail(res, 400, 'INVALID_IMAGE', 'Please upload a screenshot (JPG, PNG or WEBP).');

    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
      return fail(res, 400, 'IMAGE_SIZE', 'The screenshot is too large (max 5 MB).');
    }

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const dup = await Submission.findOne({ proofHash: hash });
    if (dup && (!existing || String(dup._id) !== String(existing._id))) {
      return fail(res, 400, 'DUPLICATE_PROOF', 'This screenshot has already been used.');
    }

    const slotFilter = { _id: task._id };
    if (task.maxUsers > 0) slotFilter.filledCount = { $lt: task.maxUsers };
    const slot = await Task.findOneAndUpdate(slotFilter, { $inc: { filledCount: 1 } }, { new: true });
    if (!slot) return fail(res, 400, 'TASK_FULL', 'All slots for this task are taken.');
    reserved = true;

    const note = String(req.body.note || '').trim().slice(0, 200);
    const caption = 'Task: ' + task.title + '\nUser: ' + userId;
    const fileId = await sendPhotoBuffer(process.env.PROOF_CHANNEL_ID, buffer, match[1], caption);

    if (!fileId) {
      await Task.updateOne({ _id: task._id, filledCount: { $gt: 0 } }, { $inc: { filledCount: -1 } });
      reserved = false;
      return fail(res, 502, 'UPLOAD_FAILED', 'Could not upload the screenshot. Please try again.');
    }

    if (existing) {
      await Submission.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: 'pending',
            proofFileId: fileId,
            proofHash: hash,
            proofNote: note,
            rejectReason: '',
            reviewedBy: null,
            reviewedAt: null
          }
        }
      );
    } else {
      await Submission.create({
        taskId: task._id,
        userId: userId,
        proofFileId: fileId,
        proofHash: hash,
        proofNote: note
      });
    }

    res.json({ success: true, data: { status: 'pending' } });
  } catch (err) {
    if (reserved && task) {
      await Task.updateOne({ _id: task._id, filledCount: { $gt: 0 } }, { $inc: { filledCount: -1 } }).catch(() => {});
    }
    if (err && err.code === 11000) {
      return fail(res, 400, 'ALREADY_SUBMITTED', 'You have already submitted this task.');
    }
    console.error('Task submit error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

module.exports = router;
