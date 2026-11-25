const mongoose = require("mongoose");

const shiftSwapRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requesterAssignment: { type: mongoose.Schema.Types.ObjectId, ref: "ShiftAssignment", required: true },
  targetEmployee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetAssignment: { type: mongoose.Schema.Types.ObjectId, ref: "ShiftAssignment", required: true },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Cancelled"],
    default: "Pending",
  },
  respondedAt: { type: Date },
}, { timestamps: true });

shiftSwapRequestSchema.index({ requester:  1, createdAt: -1 });
shiftSwapRequestSchema.index({ targetEmployee: 1, createdAt: -1 });

module.exports = mongoose.model("ShiftSwapRequest", shiftSwapRequestSchema);
