const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  leaveType: { type: String, enum: ["Annual leave", "Sick leave", "Personal", "Unpaid"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  adminRemarks: { type: String, trim: true, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
}, { timestamps: true });

leaveSchema.pre("validate", function validateDates() {
  if (this.endDate < this.startDate) {
    this.invalidate("endDate", "End date must be on or after start date");
  }
});

module.exports = mongoose.model("LeaveRequest", leaveSchema);
