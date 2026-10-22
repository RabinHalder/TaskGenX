const mongoose = require("mongoose");
const { Schema } = mongoose;

// Remembers FINZO callback delivery IDs so the same delivery is handled only once.
// Records are removed automatically after 30 days.
const webhookEventSchema = new Schema({
  deliveryId: { type: String, required: true, unique: true },
  event: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
