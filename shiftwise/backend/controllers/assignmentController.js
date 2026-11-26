const Shift = require("../models/Shift");
const ShiftAssignment = require("../models/ShiftAssignment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const notifyAdmins = require("../utils/notifyAdmins");
const asyncHandler = require("../utils/asyncHandler");
const { calendarDate, dateKey, legacyShiftDate } = require("../utils/shiftDate");

const toMinutes = (value) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "Employee") filter.employee = req.user._id;
  if (req.user.role === "Admin" && req.query.employee) filter.employee = req.query.employee;
  filter.status = req.query.status || { $ne: "Cancelled" };
  if (req.query.from || req.query.to) {
    filter.assignedDate = {};
    if (req.query.from) filter.assignedDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.assignedDate.$lte = new Date(req.query.to);
  }
  const assignments = await ShiftAssignment.find(filter)
    .populate("employee", "-password")
    .populate("shift")
    .sort({ assignedDate: 1 });
  res.json({ assignments });
});

exports.create = asyncHandler(async (req, res) => {
  const { shift, assignedDate } = req.body;
  const employee = req.user.role === "Employee" ? req.user._id : req.body.employee;
  const status = req.user.role === "Employee" ? "Pending" : (req.body.status || "Confirmed");
  if (!employee) return res.status(422).json({ message: "An employee is required" });
  const employeeRecord = await User.findOne({ _id: employee, role: "Employee", employmentStatus: "Active" });
  if (!employeeRecord) return res.status(404).json({ message: "Active employee not found" });
  const shiftRecord = await Shift.findById(shift);
  if (!shiftRecord) return res.status(404).json({ message: "Shift not found" });
  const dateStart = calendarDate(assignedDate);
  const expectedShiftDate = shiftRecord.shiftDate || legacyShiftDate(shiftRecord.weekOffset, shiftRecord.dayIndex);
  if (dateKey(dateStart) !== dateKey(expectedShiftDate)) {
    return res.status(422).json({ message: "Assignment date must match the selected shift date." });
  }

  const dateEnd = new Date(dateStart);
  dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);
  const existing = await ShiftAssignment.find({
    employee,
    assignedDate: { $gte: dateStart, $lt: dateEnd },
    status: { $ne: "Cancelled" },
  }).populate("shift");

  const overlaps = existing.some((item) =>
    toMinutes(item.shift.startTime) < toMinutes(shiftRecord.endTime) &&
    toMinutes(shiftRecord.startTime) < toMinutes(item.shift.endTime)
  );
  if (overlaps) return res.status(409).json({ message: "Employee already has an overlapping shift on this date" });

  const assignedCount = await ShiftAssignment.countDocuments({
    shift,
    assignedDate: dateStart,
    status: { $ne: "Cancelled" },
  });
  if (assignedCount >= shiftRecord.staffRequired) {
    return res.status(409).json({ message: "This shift has no remaining staff slots" });
  }

  let assignment = await ShiftAssignment.findOne({ employee, shift, assignedDate: dateStart });
  if (assignment) {
    if (assignment.status !== "Cancelled") {
      return res.status(409).json({ message: "This employee already has this shift assignment" });
    }
    assignment.status = status;
    await assignment.save();
  } else {
    assignment = await ShiftAssignment.create({ employee, shift, assignedDate: dateStart, status });
  }
  await assignment.populate(["employee", "shift"]);
  if (req.user.role === "Admin") {
    await Notification.create({
      recipient: assignment.employee._id,
      title: "New shift assigned",
      message: `A ${assignment.shift.type.toLowerCase()} shift was assigned on ${dateKey(dateStart)}.`,
      type: "Shift",
    });
  } else {
    await notifyAdmins({
      title: "Open shift requested",
      message: `${employeeRecord.fullName} requested an available shift.`,
      type: "Shift",
    });
  }
  res.status(201).json({ assignment });
});

exports.update = asyncHandler(async (req, res) => {
  const locked = await ShiftAssignment.exists({
    _id: req.params.id,
    swapRequest: { $ne: null },
  });
  if (locked) return res.status(409).json({ message: "This assignment is locked by a pending shift swap." });

  const assignment = await ShiftAssignment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(["employee", "shift"]);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  if (req.body.status) {
    await Notification.create({
      recipient: assignment.employee._id,
      title: "Shift request updated",
      message: `Your shift assignment status is now ${assignment.status.toLowerCase()}.`,
      type: "Shift",
    });
  }
  res.json({ assignment });
});

exports.remove = asyncHandler(async (req, res) => {
  const locked = await ShiftAssignment.exists({
    _id: req.params.id,
    swapRequest: { $ne: null },
  });
  if (locked) return res.status(409).json({ message: "This assignment is locked by a pending shift swap." });

  const assignment = await ShiftAssignment.findByIdAndUpdate(
    req.params.id,
    { status: "Cancelled" },
    { new: true }
  ).populate("employee");
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  await Notification.create({
    recipient: assignment.employee._id,
    title: "Shift assignment updated",
    message: "Your shift assignment was removed.",
    type: "Shift",
  });
  res.json({ assignment, message: "Assignment removed" });
});
