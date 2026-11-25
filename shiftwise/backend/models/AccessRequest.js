const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  requestedRole: { type: String, enum: ["Employee", "Admin"], required: true },
  message: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  invitedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  processingAt: { type: Date, select: false },
}, { timestamps: true });

accessRequestSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } }
);
accessRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("AccessRequest", accessRequestSchema);
