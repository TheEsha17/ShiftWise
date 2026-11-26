const Shift = require("../models/Shift");
const ShiftAssignment = require("../models/ShiftAssignment");
const asyncHandler = require("../utils/asyncHandler");
const { calendarDate, dateKey, legacyShiftDate, weekFieldsForDate } = require("../utils/shiftDate");

const shiftFields = [
  "name", "type", "startTime", "endTime", "breakDuration", "workingDays",
  "department", "location", "staffRequired", "status",
];

const duplicateShift = async (payload, exceptId) => {
  const filter = {
    shiftDate: payload.shiftDate,
    type: payload.type,
    startTime: payload.startTime,
    endTime: payload.endTime,
    department: payload.department,
    location: payload.location,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  };
  return Shift.findOne(filter);
};

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.status) filter.status = req.query.status;
  const shifts = await Shift.find(filter);
  const withAvailability = await Promise.all(shifts.map(async (shift) => {
    const assignedDate = shift.shiftDate || legacyShiftDate(shift.weekOffset, shift.dayIndex);
    const shiftDate = dateKey(assignedDate);
    const date = calendarDate(shiftDate);
    const assignedCount = await ShiftAssignment.countDocuments({
      shift: shift._id,
      assignedDate: date,
      status: { $ne: "Cancelled" },
    });
    const weekFields = weekFieldsForDate(date);
    return {
      ...shift.toObject(),
      shiftDate,
      ...weekFields,
      assignedCount,
      openSlots: Math.max(0, shift.staffRequired - assignedCount),
    };
  }));
  withAvailability.sort((a, b) => a.shiftDate.localeCompare(b.shiftDate) || a.startTime.localeCompare(b.startTime));
  res.json({ shifts: withAvailability });
});

exports.get = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) return res.status(404).json({ message: "Shift not found" });
  res.json({ shift });
});

exports.create = asyncHandler(async (req, res) => {
  const shiftDate = calendarDate(req.body.shiftDate);
  const payload = Object.fromEntries(shiftFields
    .filter((field) => req.body[field] !== undefined)
    .map((field) => [field, req.body[field]]));
  Object.assign(payload, { shiftDate }, weekFieldsForDate(shiftDate));
  if (await duplicateShift(payload)) {
    return res.status(409).json({ message: "An identical shift already exists on this date." });
  }
  const shift = await Shift.create(payload);
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
  if (req.body.shiftDate !== undefined) {
    const requestedDate = calendarDate(req.body.shiftDate);
    const current = await Shift.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Shift not found" });
    const currentDate = current.shiftDate || legacyShiftDate(current.weekOffset, current.dayIndex);
    if (dateKey(requestedDate) !== dateKey(currentDate)) {
      const assigned = await ShiftAssignment.exists({ shift: req.params.id, status: { $ne: "Cancelled" } });
      if (assigned) {
        return res.status(409).json({ message: "Remove assigned employees before changing this shift date." });
      }
    }
  }
  const payload = Object.fromEntries(shiftFields
    .filter((field) => req.body[field] !== undefined)
    .map((field) => [field, req.body[field]]));
  if (req.body.shiftDate !== undefined) {
    payload.shiftDate = calendarDate(req.body.shiftDate);
    Object.assign(payload, weekFieldsForDate(payload.shiftDate));
  }
  const current = await Shift.findById(req.params.id);
  if (!current) return res.status(404).json({ message: "Shift not found" });
  const combined = { ...current.toObject(), ...payload };
  if (combined.shiftDate && await duplicateShift(combined, current._id)) {
    return res.status(409).json({ message: "An identical shift already exists on this date." });
  }
  const shift = await Shift.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
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
