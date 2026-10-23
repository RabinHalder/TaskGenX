const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    tgId: { type: Number, required: true, unique: true, index: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    username: { type: String, default: "" },
    photoUrl: { type: String, default: "" },

    // Money (INR, single balance)
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },

    // Progress
    level: { type: Number, default: 1 },
    tasksApproved: { type: Number, default: 0 },
    // Tasks approved since the user entered the current level (restarts on every level-up)
    levelTasks: { type: Number, default: 0 },

    // Referral (single level)
    referredBy: { type: Number, default: null, index: true },
    referralRewarded: { type: Boolean, default: false },
    referralCount: { type: Number, default: 0 },

    // Daily check-in
    checkin: {
      streak: { type: Number, default: 0 },
      lastDate: { type: String, default: "" },
      total: { type: Number, default: 0 },
    },

    // Saved withdraw details
    withdrawDetails: {
      upi: { type: String, default: "" },
      finzoWallet: { type: String, default: "" },
    },

    // Preferences
    language: { type: String, enum: ["en", "bn"], default: "en" },
    theme: { type: String, enum: ["light", "dark", "auto"], default: "auto" },
    customize: {
      accent: { type: String, default: "" },
      btnStyle: { type: String, enum: ["round", "soft", "square"], default: "round" },
      cardStyle: { type: String, enum: ["glass", "flat", "outline"], default: "glass" },
    },
    notifications: { type: Boolean, default: true },
    hideName: { type: Boolean, default: false },
    hideBalance: { type: Boolean, default: false },

    // Status
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
    botBlocked: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
