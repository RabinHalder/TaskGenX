const mongoose = require("mongoose");
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title: {
      en: { type: String, required: true },
      bn: { type: String, default: "" },
    },
    description: {
      en: { type: String, default: "" },
      bn: { type: String, default: "" },
    },
    category: { type: String, default: "other", index: true },
    reward: { type: Number, required: true, min: 0 },
    link: { type: String, default: "" },
    proofRequired: { type: Boolean, default: true },

    limitPerUser: { type: Number, default: 1 }, // how many times one user can do it
    totalLimit: { type: Number, default: 0 }, // 0 = unlimited
    filled: { type: Number, default: 0 }, // pending + approved submissions
    expiresAt: { type: Date, default: null },

    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
