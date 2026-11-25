const Attendance = require("../models/Attendance");
const ShiftAssignment = require("../models/ShiftAssignment");
const asyncHandler = require("../utils/asyncHandler");

const dayRange = (value) => {
  const parsed = value ? new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`) : new Date();
  const date = new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return { date, next };
};

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "Employee") filter.employee = req.user._id;
  if (req.user.role === "Admin" && req.query.employee) filter.employee = req.query.employee;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }
  const records = await Attendance.find(filter)
    .populate("employee", "-password")
    .sort({ date: -1 });
  res.json({ records });
});

exports.checkIn = asyncHandler(async (req, res) => {
  const { date } = dayRange(req.body.date);
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const assignments = await ShiftAssignment.find({
    employee: req.user._id,
    assignedDate: { $gte: date, $lt: nextDate },
    status: { $ne: "Cancelled" },
  }).populate("shift");
  const now = new Date();
  const late = assignments.some((assignment) => {
    const [hour, minute] = assignment.shift.startTime.split(":").map(Number);
    const shiftStart = new Date(now);
    shiftStart.setHours(hour, minute + 10, 0, 0);
    return now > shiftStart;
  });
  const record = await Attendance.findOneAndUpdate(
    { employee: req.user._id, date },
    { employee: req.user._id, date, checkInTime: now, status: late ? "Late" : "Present" },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ record });
});

exports.checkOut = asyncHandler(async (req, res) => {
  const { date } = dayRange(req.body.date);
  const record = await Attendance.findOne({ employee: req.user._id, date });
  if (!record || !record.checkInTime) {
    return res.status(404).json({ message: "No active check-in for this date" });
  }
  record.checkOutTime = new Date();
  await record.save();
  res.json({ record });
});

exports.upsert = asyncHandler(async (req, res) => {
  const { date } = dayRange(req.body.date);
  const record = await Attendance.findOneAndUpdate(
    { employee: req.body.employee, date },
    { ...req.body, date },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate("employee", "-password");
  res.json({ record });
});
