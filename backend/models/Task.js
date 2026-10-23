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

    // Which level can see and do this task (0 = all levels, 1 = Bronze, 2 = Silver ...)
    level: { type: Number, default: 0, index: true },

    // A task can be done once per user, so this is always 1
    limitPerUser: { type: Number, default: 1 },
    totalLimit: { type: Number, default: 0 }, // 0 = unlimited
    filled: { type: Number, default: 0 }, // pending + approved submissions
    expiresAt: { type: Date, default: null },

    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
