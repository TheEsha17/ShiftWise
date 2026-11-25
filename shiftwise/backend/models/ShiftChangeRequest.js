const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  currentShift: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", required: true },
  requestedShift: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String, required: true, trim: true },
  requestDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  adminRemarks: { type: String, trim: true, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("ShiftChangeRequest", requestSchema);
