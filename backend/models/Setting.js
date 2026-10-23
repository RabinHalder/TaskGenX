const mongoose = require("mongoose");
const { Schema } = mongoose;

const T = (def) => ({ type: String, default: def });
const N = (def) => ({ type: Number, default: def });
const B = (def) => ({ type: Boolean, default: def });
const limits = (min, max, daily) => ({ enabled: B(true), min: N(min), max: N(max), dailyLimit: N(daily) });

// minTasks / minReferrals = what a user must do to REACH this level.
// Tasks are counted from the moment the user entered the previous level.
const levelSchema = new Schema(
  {
    name: String,
    minTasks: Number,
    minReferrals: Number,
    withdrawFeePercent: Number,
    monthlyWithdrawals: { type: Number, default: 2 },
  },
  { _id: false }
);

const categorySchema = new Schema({ id: String, en: String, icon: String }, { _id: false });

const faqSchema = new Schema({ qEn: String, qBn: String, aEn: String, aBn: String }, { _id: false });

const defaultLevels = () => [
  { name: "Bronze", minTasks: 0, minReferrals: 0, withdrawFeePercent: 10, monthlyWithdrawals: 2 },
  { name: "Silver", minTasks: 10, minReferrals: 0, withdrawFeePercent: 8, monthlyWithdrawals: 2 },
  { name: "Gold", minTasks: 15, minReferrals: 0, withdrawFeePercent: 6, monthlyWithdrawals: 3 },
  { name: "Platinum", minTasks: 25, minReferrals: 0, withdrawFeePercent: 5, monthlyWithdrawals: 4 },
  { name: "Diamond", minTasks: 40, minReferrals: 0, withdrawFeePercent: 4, monthlyWithdrawals: 5 },
  { name: "Master", minTasks: 60, minReferrals: 0, withdrawFeePercent: 3, monthlyWithdrawals: 6 },
  { name: "Grandmaster", minTasks: 100, minReferrals: 0, withdrawFeePercent: 2, monthlyWithdrawals: 8 },
];

const defaultCategories = () => [
  { id: "social", en: "Social Media", icon: "users" },
  { id: "app", en: "App Install", icon: "smartphone" },
  { id: "video", en: "Video", icon: "play" },
  { id: "survey", en: "Survey", icon: "clipboard" },
  { id: "other", en: "Other", icon: "grid" },
];

const defaultFaq = () => [
  {
    qEn: "How do I earn money?",
    qBn: "আমি কীভাবে আয় করব?",
    aEn: "Open the Task tab, pick a task, follow the steps, upload a screenshot as proof and wait for approval.",
    aBn: "Task ট্যাব খুলুন, একটি টাস্ক বেছে নিন, ধাপগুলো সম্পন্ন করুন, প্রমাণ হিসেবে স্ক্রিনশট আপলোড করুন এবং অনুমোদনের অপেক্ষা করুন।",
  },
  {
    qEn: "How long does approval take?",
    qBn: "অনুমোদনে কত সময় লাগে?",
    aEn: "Most proofs are reviewed within a few hours. You will get a notification when it is done.",
    aBn: "বেশিরভাগ প্রমাণ কয়েক ঘণ্টার মধ্যে যাচাই হয়। যাচাই শেষ হলে আপনি নোটিফিকেশন পাবেন।",
  },
  {
    qEn: "How do I withdraw?",
    qBn: "আমি কীভাবে টাকা তুলব?",
    aEn: "Save your UPI or FINZO Wallet details in Profile, then tap Withdraw on the Home tab.",
    aBn: "Profile-এ আপনার UPI বা FINZO Wallet তথ্য সেভ করুন, তারপর Home ট্যাবে Withdraw চাপুন।",
  },
  {
    qEn: "How do levels work?",
    qBn: "লেভেল কীভাবে কাজ করে?",
    aEn: "Complete the required number of tasks at your current level to move up. Higher levels have lower withdraw fees and more withdrawals per month.",
    aBn: "এখনকার লেভেলে নির্দিষ্ট সংখ্যক টাস্ক শেষ করলে পরের লেভেলে যাবেন। উঁচু লেভেলে উইথড্র ফি কম এবং মাসে বেশি উইথড্র করা যায়।",
  },
  {
    qEn: "How does the referral reward work?",
    qBn: "রেফারেল পুরস্কার কীভাবে কাজ করে?",
    aEn: "Share your invite link. You get a fixed reward for every friend who joins and completes their first approved task.",
    aBn: "আপনার আমন্ত্রণ লিংক শেয়ার করুন। যে বন্ধু যোগ দিয়ে প্রথম টাস্ক সম্পন্ন করবে, তার জন্য আপনি নির্দিষ্ট পুরস্কার পাবেন।",
  },
];

const settingSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true },

    app: {
      name: T("TaskGenX"),
      botUsername: T(""),
      appShortName: T(""),
      supportLink: T(""),
      channelLink: T(""),
      timezone: T("Asia/Kolkata"),
      maintenance: B(false),
      maintenanceMessage: T("We are upgrading. Please try again soon."),
    },

    bonus: { welcome: N(0) },

    deposit: {
      enabled: B(true),
      min: N(50),
      max: N(50000),
      feePercent: N(0),
    },

    withdraw: {
      enabled: B(true),
      autoPayout: B(true),
      approvalEnabled: B(true),
      approvalAbove: N(5000),
      upi: limits(100, 25000, 25000),
      wallet: limits(50, 10000, 10000),
    },

    referral: {
      enabled: B(true),
      reward: N(5),
      payOn: { type: String, enum: ["first_task", "join"], default: "first_task" },
    },

    checkin: {
      enabled: B(true),
      rewards: { type: [Number], default: () => [1, 1, 2, 2, 3, 3, 5] },
    },

    proof: { maxSizeMB: N(5) },

    club: {
      enabled: B(true),
      showLimit: N(30),
    },

    admins: { type: [Number], default: [] },
    levels: { type: [levelSchema], default: defaultLevels },
    categories: { type: [categorySchema], default: defaultCategories },
    faq: { type: [faqSchema], default: defaultFaq },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model("Setting", settingSchema);
