const Shift = require("../models/Shift");
const ShiftAssignment = require("../models/ShiftAssignment");
const asyncHandler = require("../utils/asyncHandler");

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.status) filter.status = req.query.status;
  const shifts = await Shift.find(filter).sort({ weekOffset: 1, dayIndex: 1, startTime: 1 });
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const withAvailability = await Promise.all(shifts.map(async (shift) => {
    const assignedDate = new Date(Date.UTC(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + (shift.weekOffset || 0) * 7 + (shift.dayIndex || 0)
    ));
    const assignedCount = await ShiftAssignment.countDocuments({
      shift: shift._id,
      assignedDate,
      status: { $ne: "Cancelled" },
    });
    return {
      ...shift.toObject(),
      assignedCount,
      openSlots: Math.max(0, shift.staffRequired - assignedCount),
    };
  }));
  res.json({ shifts: withAvailability });
});

exports.get = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) return res.status(404).json({ message: "Shift not found" });
  res.json({ shift });
});

exports.create = asyncHandler(async (req, res) => {
  const shift = await Shift.create(req.body);
  res.status(201).json({ shift });
});

exports.update = asyncHandler(async (req, res) => {
  const lockedAssignment = await ShiftAssignment.exists({
    shift: req.params.id,
    swapRequest: { $ne: null },
  });
  if (lockedAssignment) {
    return res.status(409).json({ message: "This shift is part of a pending swap and cannot be changed yet." });
  }
  const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!shift) return res.status(404).json({ message: "Shift not found" });
  res.json({ shift });
});

exports.remove = asyncHandler(async (req, res) => {
  const lockedAssignment = await ShiftAssignment.exists({
    shift: req.params.id,
    swapRequest: { $ne: null },
  });
  if (lockedAssignment) {
    return res.status(409).json({ message: "This shift is part of a pending swap and cannot be deleted yet." });
  }
  const shift = await Shift.findByIdAndDelete(req.params.id);
  if (!shift) return res.status(404).json({ message: "Shift not found" });
  res.json({ message: "Shift deleted" });
});
