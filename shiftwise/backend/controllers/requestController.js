const ShiftChangeRequest = require("../models/ShiftChangeRequest");
const ShiftAssignment = require("../models/ShiftAssignment");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const notifyAdmins = require("../utils/notifyAdmins");

exports.listChanges = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "Employee") filter.employee = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const requests = await ShiftChangeRequest.find(filter)
    .populate("employee", "-password")
    .populate("currentShift")
    .sort({ createdAt: -1 });
  res.json({ requests });
});

exports.createChange = asyncHandler(async (req, res) => {
  const employee = req.user.role === "Employee" ? req.user._id : req.body.employee;
  if (req.user.role === "Employee") {
    const ownAssignment = await ShiftAssignment.findOne({
      employee,
      shift: req.body.currentShift,
      status: { $ne: "Cancelled" },
    });
    if (!ownAssignment) {
      return res.status(403).json({ message: "You can only request a change to your own assigned shift" });
    }
  }
  const request = await ShiftChangeRequest.create({
    employee,
    currentShift: req.body.currentShift,
    requestedShift: req.body.requestedShift,
    reason: req.body.reason,
  });
  await request.populate(["employee", "currentShift"]);
  await notifyAdmins({
    title: "New shift change request",
    message: `${request.employee.fullName} submitted a shift change request.`,
    type: "Request",
  });
  res.status(201).json({ request });
});

exports.cancelChange = asyncHandler(async (req, res) => {
  const request = await ShiftChangeRequest.findOneAndDelete({
    _id: req.params.id,
    employee: req.user._id,
    status: "Pending",
  });
  if (!request) return res.status(404).json({ message: "Pending shift change request not found" });
  res.json({ message: "Shift change request cancelled" });
});

exports.decideChange = asyncHandler(async (req, res) => {
  if (!["Approved", "Rejected"].includes(req.body.status)) {
    return res.status(422).json({ message: "Status must be Approved or Rejected" });
  }
  const request = await ShiftChangeRequest.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      adminRemarks: req.body.adminRemarks || "",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate("employee", "-password");
  if (!request) return res.status(404).json({ message: "Shift change request not found" });

  await Notification.create({
    recipient: request.employee._id,
    title: "Shift change request updated",
    message: `Your shift change request was ${req.body.status.toLowerCase()}.`,
    type: "Request",
  });
  res.json({ request });
});
