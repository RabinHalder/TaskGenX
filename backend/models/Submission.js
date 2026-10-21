const mongoose = require("mongoose");
const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tgId: { type: Number, required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reward: { type: Number, required: true }, // reward snapshot at submit time

    // Proof stored in the private Telegram channel
    proofHash: { type: String, default: undefined },
    proofFileId: { type: String, default: "" },
    proofFileUniqueId: { type: String, default: "" },
    proofMessageId: { type: Number, default: 0 },

    rejectReason: { type: String, default: "" },
    reviewedBy: { type: Number, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

submissionSchema.index({ proofHash: 1 }, { unique: true, sparse: true });
submissionSchema.index({ user: 1, task: 1 });
submissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
