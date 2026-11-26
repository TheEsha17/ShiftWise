const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ["Shift", "Request", "Attendance", "Leave", "System"], default: "System" },
  read: { type: Boolean, default: false },
  relatedSwapRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ShiftSwapRequest" },
  swapDirection: { type: String, enum: ["incoming", "outgoing"] },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
