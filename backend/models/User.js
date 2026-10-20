const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true, unique: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    username: { type: String, default: '' },
    photoUrl: { type: String, default: '' },

    balance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0 },
    totalReferralEarned: { type: Number, default: 0 },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },

    level: { type: Number, default: 1 },
    tasksCompleted: { type: Number, default: 0 },
    referralsCount: { type: Number, default: 0 },

    referredBy: { type: Number, default: null },
    referredByLevel2: { type: Number, default: null },

    withdrawMonth: { type: String, default: '' },
    withdrawnThisMonth: { type: Number, default: 0 },

    upiId: { type: String, default: '' },
    walletNumber: { type: String, default: '' },
    withdrawName: { type: String, default: '' },

    language: { type: String, enum: ['en', 'bn'], default: 'en' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notificationsOn: { type: Boolean, default: true },
    hideInClub: { type: Boolean, default: false },

    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },

    lastCheckIn: { type: Date, default: null },
    checkInStreak: { type: Number, default: 0 },
    signupBonusGiven: { type: Boolean, default: false },

    lastActiveAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('fullName').get(function () {
  const name = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  return name || this.username || 'User';
});

module.exports = mongoose.model('User', userSchema);
