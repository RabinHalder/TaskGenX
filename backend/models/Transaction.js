const mongoose = require("mongoose");
const { Schema } = mongoose;

// Ledger: every balance change is recorded here.
const transactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tgId: { type: Number, required: true, index: true },
    type: {
      type: String,
      enum: [
        "task",
        "deposit",
        "withdraw",
        "withdraw_refund",
        "referral_l1",
        "referral_l2",
        "checkin",
        "bonus",
        "admin_adjust",
      ],
      required: true,
    },
    amount: { type: Number, required: true }, // signed: + credit, - debit
    balanceAfter: { type: Number, default: 0 },
    note: { type: String, default: "" },
    ref: { type: String, default: "" }, // related order / submission id
  },
  { timestamps: true }
);

transactionSchema.index({ tgId: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
