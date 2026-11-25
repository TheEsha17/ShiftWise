const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", required: true },
  assignedDate: { type: Date, required: true },
  status: { type: String, enum: ["Confirmed", "Pending", "Cancelled"], default: "Confirmed" },
  swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ShiftSwapRequest", default: null },
}, { timestamps: true });

assignmentSchema.index({ employee: 1, shift: 1, assignedDate: 1 }, { unique: true });

module.exports = mongoose.model("ShiftAssignment", assignmentSchema);
