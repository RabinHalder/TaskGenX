const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'deposit',
        'withdraw',
        'task_reward',
        'referral_commission',
        'signup_bonus',
        'checkin_bonus',
        'admin_adjust',
        'refund'
      ]
    },
    direction: { type: String, required: true, enum: ['credit', 'debit'] },
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'],
      default: 'pending'
    },

    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },

    orderId: { type: String, unique: true, sparse: true },
    method: { type: String, enum: ['upi', 'wallet', ''], default: '' },
    destination: { type: String, default: '' },
    beneficiaryName: { type: String, default: '' },

    fromUserId: { type: Number, default: null },
    note: { type: String, default: '' },
    providerStatus: { type: String, default: '' },
    processedDeliveries: { type: [String], default: [] },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
