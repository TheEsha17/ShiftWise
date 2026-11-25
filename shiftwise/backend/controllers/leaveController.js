const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const notifyAdmins = require("../utils/notifyAdmins");

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "Employee") filter.employee = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const requests = await LeaveRequest.find(filter)
    .populate("employee", "-password")
    .sort({ createdAt: -1 });
  res.json({ requests });
});

exports.create = asyncHandler(async (req, res) => {
  const employee = req.user.role === "Employee" ? req.user._id : req.body.employee;
  const request = await LeaveRequest.create({
    employee,
    leaveType: req.body.leaveType,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    reason: req.body.reason,
  });
  await request.populate("employee", "-password");
  await notifyAdmins({
    title: "New leave request",
    message: `${request.employee.fullName} submitted a ${request.leaveType.toLowerCase()} request.`,
    type: "Leave",
  });
  res.status(201).json({ request });
});

exports.decide = asyncHandler(async (req, res) => {
  if (!["Approved", "Rejected"].includes(req.body.status)) {
    return res.status(422).json({ message: "Status must be Approved or Rejected" });
  }
  const request = await LeaveRequest.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      adminRemarks: req.body.adminRemarks || "",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate("employee", "-password");
  if (!request) return res.status(404).json({ message: "Leave request not found" });

  await Notification.create({
    recipient: request.employee._id,
    title: "Leave request updated",
    message: `Your leave request was ${req.body.status.toLowerCase()}.`,
    type: "Leave",
  });
  res.json({ request });
});
