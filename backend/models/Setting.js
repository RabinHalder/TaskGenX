const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true },
    name: { type: String, required: true },
    requiredTasks: { type: Number, default: 0 },
    requiredReferrals: { type: Number, default: 0 },
    withdrawFeePercent: { type: Number, default: 0 },
    monthlyWithdrawLimit: { type: Number, default: 0 }
  },
  { _id: false }
);

function defaultLevels() {
  return [
    { level: 1, name: 'Bronze', requiredTasks: 0, requiredReferrals: 0, withdrawFeePercent: 10, monthlyWithdrawLimit: 2000 },
    { level: 2, name: 'Silver', requiredTasks: 10, requiredReferrals: 3, withdrawFeePercent: 8, monthlyWithdrawLimit: 5000 },
    { level: 3, name: 'Gold', requiredTasks: 30, requiredReferrals: 10, withdrawFeePercent: 6, monthlyWithdrawLimit: 10000 },
    { level: 4, name: 'Platinum', requiredTasks: 70, requiredReferrals: 25, withdrawFeePercent: 5, monthlyWithdrawLimit: 20000 },
    { level: 5, name: 'Diamond', requiredTasks: 150, requiredReferrals: 50, withdrawFeePercent: 4, monthlyWithdrawLimit: 40000 },
    { level: 6, name: 'Master', requiredTasks: 300, requiredReferrals: 100, withdrawFeePercent: 3, monthlyWithdrawLimit: 80000 },
    { level: 7, name: 'Grandmaster', requiredTasks: 600, requiredReferrals: 200, withdrawFeePercent: 2, monthlyWithdrawLimit: 150000 }
  ];
}

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    appName: { type: String, default: 'TaskGenX' },
    supportLink: { type: String, default: '' },
    extraAdmins: { type: [Number], default: [] },

    maintenance: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: 'We are under maintenance. Please try again later.' }
    },

    deposit: {
      enabled: { type: Boolean, default: true },
      min: { type: Number, default: 50 },
      max: { type: Number, default: 100000 },
      feeType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
      feeValue: { type: Number, default: 0 }
    },

    withdraw: {
      enabled: { type: Boolean, default: true },
      upiEnabled: { type: Boolean, default: true },
      walletEnabled: { type: Boolean, default: true },
      autoApprove: { type: Boolean, default: true },
      min: { type: Number, default: 50 },
      max: { type: Number, default: 10000 },
      dailyLimit: { type: Number, default: 5000 },
      adminApprovalAbove: { type: Number, default: 0 }
    },

    referral: {
      level1Percent: { type: Number, default: 10 },
      level2Percent: { type: Number, default: 5 }
    },

    bonus: {
      signup: { type: Number, default: 0 },
      dailyCheckIn: { type: Number, default: 0 }
    },

    levels: { type: [levelSchema], default: defaultLevels },

    taskCategories: {
      type: [String],
      default: ['Social Media', 'Apps', 'Website', 'Others']
    },

    club: {
      enabled: { type: Boolean, default: true },
      maxEntries: { type: Number, default: 50 }
    }
  },
  { timestamps: true }
);

settingSchema.statics.getSettings = async function () {
  let doc = await this.findOne({ key: 'main' });
  if (!doc) {
    try {
      doc = await this.create({ key: 'main' });
    } catch (err) {
      doc = await this.findOne({ key: 'main' });
    }
  }
  return doc;
};

module.exports = mongoose.model('Setting', settingSchema);
