const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ["Early", "Mid", "Late"], required: true },
  startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  breakDuration: { type: Number, min: 0, default: 0 },
  workingDays: [{ type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }],
  department: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  staffRequired: { type: Number, min: 1, required: true, default: 1 },
  weekOffset: { type: Number, default: 0 },
  dayIndex: { type: Number, min: 0, max: 6, default: 0 },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

module.exports = mongoose.model("Shift", shiftSchema);
