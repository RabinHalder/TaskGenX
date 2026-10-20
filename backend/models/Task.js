const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, trim: true },
    reward: { type: Number, required: true, min: 0 },
    link: { type: String, default: '' },
    instructions: { type: [String], default: [] },

    maxUsers: { type: Number, default: 0 },
    filledCount: { type: Number, default: 0 },

    publishAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'paused', 'ended'], default: 'active' },

    createdBy: { type: Number, default: null }
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, category: 1, publishAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
