const User = require("../models/User");
const Shift = require("../models/Shift");
const ShiftAssignment = require("../models/ShiftAssignment");
const ShiftChangeRequest = require("../models/ShiftChangeRequest");
const LeaveRequest = require("../models/LeaveRequest");
const Attendance = require("../models/Attendance");
const asyncHandler = require("../utils/asyncHandler");

exports.admin = asyncHandler(async (req, res) => {
  const [employees, shifts, assignments, changeRequests, leaveRequests, attendance] = await Promise.all([
    User.countDocuments({ role: "Employee", employmentStatus: { $ne: "Inactive" } }),
    Shift.countDocuments({ status: "Active" }),
    ShiftAssignment.countDocuments({ status: "Confirmed" }),
    ShiftChangeRequest.countDocuments({ status: "Pending" }),
    LeaveRequest.countDocuments({ status: "Pending" }),
    Attendance.countDocuments({ status: { $in: ["Present", "Late"] } }),
  ]);
  res.json({
    metrics: {
      employees,
      activeShifts: shifts,
      confirmedAssignments: assignments,
      pendingShiftChanges: changeRequests,
      pendingLeaveRequests: leaveRequests,
      presentRecords: attendance,
    },
  });
});

exports.employee = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const [assignments, changeRequests, leaveRequests, attendance, notifications] = await Promise.all([
    ShiftAssignment.find({ employee: employeeId, status: { $ne: "Cancelled" } }).populate("shift"),
    ShiftChangeRequest.countDocuments({ employee: employeeId, status: "Pending" }),
    LeaveRequest.find({ employee: employeeId }).sort({ createdAt: -1 }),
    Attendance.find({ employee: employeeId }).sort({ date: -1 }).limit(30),
    require("../models/Notification").countDocuments({ recipient: employeeId, read: false }),
  ]);
  res.json({
    profile: req.user,
    assignments,
    pendingShiftChanges: changeRequests,
    leaveRequests,
    attendance,
    unreadNotifications: notifications,
  });
});
