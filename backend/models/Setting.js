const mongoose = require("mongoose");
const { Schema } = mongoose;

const T = (def) => ({ type: String, default: def });
const N = (def) => ({ type: Number, default: def });
const B = (def) => ({ type: Boolean, default: def });

const levelSchema = new Schema(
  {
    name: String,
    nameBn: String,
    minTasks: Number,
    minReferrals: Number,
    withdrawFeePercent: Number,
    monthlyWithdrawLimit: Number,
  },
  { _id: false }
);

const categorySchema = new Schema(
  { id: String, en: String, bn: String, icon: String },
  { _id: false }
);

const faqSchema = new Schema(
  { qEn: String, qBn: String, aEn: String, aBn: String },
  { _id: false }
);

const defaultLevels = () => [
  { name: "Bronze", nameBn: "ব্রোঞ্জ", minTasks: 0, minReferrals: 0, withdrawFeePercent: 10, monthlyWithdrawLimit: 2000 },
  { name: "Silver", nameBn: "সিলভার", minTasks: 10, minReferrals: 2, withdrawFeePercent: 8, monthlyWithdrawLimit: 5000 },
  { name: "Gold", nameBn: "গোল্ড", minTasks: 30, minReferrals: 5, withdrawFeePercent: 6, monthlyWithdrawLimit: 10000 },
  { name: "Platinum", nameBn: "প্লাটিনাম", minTasks: 80, minReferrals: 10, withdrawFeePercent: 5, monthlyWithdrawLimit: 20000 },
  { name: "Diamond", nameBn: "ডায়মন্ড", minTasks: 150, minReferrals: 25, withdrawFeePercent: 4, monthlyWithdrawLimit: 40000 },
  { name: "Master", nameBn: "মাস্টার", minTasks: 300, minReferrals: 50, withdrawFeePercent: 3, monthlyWithdrawLimit: 80000 },
  { name: "Grandmaster", nameBn: "গ্র্যান্ডমাস্টার", minTasks: 600, minReferrals: 100, withdrawFeePercent: 2, monthlyWithdrawLimit: 150000 },
];

const defaultCategories = () => [
  { id: "social", en: "Social", bn: "সোশ্যাল", icon: "users" },
  { id: "app", en: "Apps", bn: "অ্যাপ", icon: "smartphone" },
  { id: "video", en: "Video", bn: "ভিডিও", icon: "play" },
  { id: "survey", en: "Survey", bn: "সার্ভে", icon: "clipboard" },
  { id: "other", en: "Other", bn: "অন্যান্য", icon: "grid" },
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
    qEn: "How does the referral bonus work?",
    qBn: "রেফারেল বোনাস কীভাবে কাজ করে?",
    aEn: "Share your link. You earn a percentage of the task earnings of people you invite and of the people they invite.",
    aBn: "আপনার লিংক শেয়ার করুন। আপনি যাদের আমন্ত্রণ করবেন এবং তারা যাদের আমন্ত্রণ করবে, তাদের টাস্ক আয়ের একটি অংশ আপনি পাবেন।",
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

    bonus: {
      welcome: N(0),
    },

    deposit: {
      enabled: B(true),
      min: N(50),
      max: N(50000),
      feePercent: N(0),
    },

    withdraw: {
      enabled: B(true),
      min: N(100),
      max: N(25000),
      dailyLimit: N(25000),
      autoPayout: B(true),
      approvalEnabled: B(true),
      approvalAbove: N(5000),
      upiEnabled: B(true),
      walletEnabled: B(true),
    },

    referral: {
      enabled: B(true),
      l1Percent: N(10),
      l2Percent: N(5),
    },

    checkin: {
      enabled: B(true),
      rewards: { type: [Number], default: () => [1, 1, 2, 2, 3, 3, 5] },
    },

    proof: {
      maxSizeMB: N(5),
    },

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
