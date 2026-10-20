const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    userId: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    proofFileId: { type: String, default: '' },
    proofHash: { type: String, default: '' },
    proofNote: { type: String, default: '' },
    rejectReason: { type: String, default: '' },

    reward: { type: Number, default: 0 },
    reviewedBy: { type: Number, default: null },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

submissionSchema.index({ taskId: 1, userId: 1 }, { unique: true });
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ proofHash: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
