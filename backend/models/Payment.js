const mongoose = require("mongoose");
const { Schema } = mongoose;

// Deposit and withdraw requests (FINZO Wallet).
// deposit : amount = user pays, fee = deposit fee, netAmount = credited to wallet
// withdraw: amount = deducted from wallet, fee = withdraw fee, netAmount = sent to user
const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tgId: { type: Number, required: true, index: true },
    type: { type: String, enum: ["deposit", "withdraw"], required: true },
    method: { type: String, enum: ["upi", "finzo_wallet"], required: true },

    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "awaiting_approval",
        "processing",
        "success",
        "failed",
        "rejected",
        "cancelled",
      ],
      default: "created",
      index: true,
    },

    orderId: { type: String, required: true, unique: true },
    gatewayRef: { type: String, default: "" },
    paymentUrl: { type: String, default: "" },
    destination: { type: String, default: "" },

    // Duplicate-callback guard: becomes true exactly once
    // (deposit credited, or withdraw finished/refunded).
    settled: { type: Boolean, default: false },
    refunded: { type: Boolean, default: false },

    failureReason: { type: String, default: "" },
    approvedBy: { type: Number, default: null },
    approvedAt: { type: Date, default: null },

    dayKey: { type: String, index: true },
    monthKey: { type: String, index: true },
    lastCheckedAt: { type: Date, default: null },
    gatewayPayload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
