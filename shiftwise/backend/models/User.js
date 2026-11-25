const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  invitationTokenHash: { type: String, select: false },
  invitationExpiresAt: { type: Date, select: false },
  role: { type: String, enum: ["Admin", "Employee"], default: "Employee", required: true },
  department: { type: String, trim: true, default: "" },
  designation: { type: String, trim: true, default: "" },
  location: { type: String, trim: true, default: "" },
  contract: { type: String, enum: ["Full-time", "Part-time", "Casual"], default: "Full-time" },
  contactDetails: {
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
  },
  joiningDate: { type: Date, default: Date.now },
  employmentStatus: { type: String, enum: ["Active", "On leave", "Inactive"], default: "Active" },
  leaveBalance: { type: Number, min: 0, default: 21 },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
