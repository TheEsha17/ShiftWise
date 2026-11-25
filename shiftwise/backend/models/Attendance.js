const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  workingHours: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["Present", "Late", "Absent", "On leave"], default: "Present" },
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.pre("save", function calculateWorkingHours() {
  if (this.checkInTime && this.checkOutTime) {
    this.workingHours = Math.max(0, (this.checkOutTime - this.checkInTime) / 36e5);
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
